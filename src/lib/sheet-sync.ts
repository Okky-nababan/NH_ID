/**
 * Sinkronisasi data keuangan dari spreadsheet Bendahara (Google Sheets) ke
 * ledger organisasi. Sumber: tab "Rekapitulasi <tahun>" (transaksi rinci),
 * tab "KAS <tahun>" (iuran bulanan per anggota), dan tab "Total Keuangan"
 * (ringkasan saldo resmi versi Bendahara).
 *
 * Daftar tab per tahun DIAMBIL OTOMATIS dari spreadsheet (lewat Google
 * Sheets API, kalau sudah dikonfigurasi -- lihat google-sheets-client.ts)
 * supaya tab tahun baru (mis. "KAS 2027") langsung terdeteksi tanpa perlu
 * ubah kode. Kalau API belum dikonfigurasi, jatuh ke daftar statis di bawah
 * (fallback) supaya sinkron tetap jalan.
 *
 * Dipakai oleh /api/kas/sync (dipicu manual dari web) dan oleh cron harian
 * (lihat vercel.json) untuk sinkronisasi otomatis berkala.
 */

import { getSheetsClient, isGoogleSheetsConfigured } from "@/lib/google-sheets-client";

const SHEET_ID = "1bGmAIjJuVn3ZLqk36cyaJ53mfK-wID8UbbCOLEClmXE";

/** Dipakai HANYA jika GOOGLE_SERVICE_ACCOUNT_* belum diset. */
const FALLBACK_REKAP_TABS: { gid: string; year: number }[] = [
  { gid: "238299411", year: 2024 },
  { gid: "1261206819", year: 2025 },
  { gid: "1642026533", year: 2026 },
];
const FALLBACK_TOTAL_KEUANGAN_GID = "1298894498";
const FALLBACK_DUES_NAMES: { name: string; year: number }[] = [
  { name: "KAS 2024", year: 2024 },
  { name: "KAS 2025", year: 2025 },
  { name: "KAS 2026", year: 2026 },
];

/** Kolom Januari dimulai di index 5 (0-based), 12 kolom berurutan s/d Desember. */
const DUES_MONTH_START_COL = 5;

const MONTHS: Record<string, number> = {
  januari: 1, februari: 2, maret: 3, april: 4, mei: 5, juni: 6,
  juli: 7, agustus: 8, agutstus: 8, austus: 8, september: 9,
  oktober: 10, november: 11, desember: 12,
};
const MONTH_SHORT_ID = [
  "Jan", "Feb", "Mar", "April", "Mei", "Juni",
  "Juli", "Agust", "Sept", "Okt", "Nov", "Des",
];

/** Daftar kategori resmi — selaras dengan nama seksi di ADRT/Kepengurusan. */
export const CATEGORIES = [
  "Kas", "Sosial", "Koor", "Rohani", "Olahraga", "Litbang", "Panitia/Acara", "Lainnya",
] as const;

function normalizeCategory(raw: string): (typeof CATEGORIES)[number] | null {
  const v = raw.trim().toLowerCase();
  if (!v) return null;
  if (v === "kas" || v === "spontanitas") return "Kas";
  if (v === "sosial" || v === "sie sosial" || v === "gereja") return "Sosial";
  if (v === "koor") return "Koor";
  if (v === "rohani" || v === "sie rohani") return "Rohani";
  if (v === "olahraga" || v === "peserta volly") return "Olahraga";
  if (v === "litbang") return "Litbang";
  if (v.startsWith("panitia") || v === "bph") return "Panitia/Acara";
  return null;
}

function inferCategory(keterangan: string): (typeof CATEGORIES)[number] {
  const v = keterangan.toLowerCase();
  if (/koor|minuman.*latihan|minum latihan|partitur/.test(v)) return "Koor";
  if (/jenguk|dukacita|\bduka\b|perpisahan|ulang ?tahun|ultah|pernikahan|wisuda|graduation|hamuliateon|silua|tuppak|akomodasi|kado/.test(v))
    return "Sosial";
  if (/olahraga|badminton|volly|futsal|turnamen|mobile legend/.test(v)) return "Olahraga";
  if (/rohani|\bpa\b|persembahan|partangiangan|podcast/.test(v)) return "Rohani";
  if (/litbang|hardisk|\botg\b|tripod/.test(v)) return "Litbang";
  if (/panitia|natal|17 ?an|makrab|gotilon|bonataon|wisata rohani|kunjungan pagaran|kunjungan kasih/.test(v))
    return "Panitia/Acara";
  if (/\bkas\b|pangkal|spontanitas/.test(v)) return "Kas";
  return "Lainnya";
}

function resolveCategory(tujuan: string, keterangan: string): string {
  return normalizeCategory(tujuan) ?? inferCategory(keterangan);
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\r") { /* ignore */ }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else field += c;
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows;
}

function parseIndoDate(raw: string, fallbackYear: number, fallback: Date): Date {
  const cleaned = raw.replace(/^[A-Za-zé]+,?\s*/, "").trim();
  const m = cleaned.match(/(\d{1,2})\s+([A-Za-z]+)/);
  if (!m) return fallback;
  const day = parseInt(m[1], 10);
  const month = MONTHS[m[2].toLowerCase()];
  if (!month || !day || day < 1 || day > 31) return fallback;
  return new Date(fallbackYear, month - 1, day);
}

function parseRupiah(raw: string): number {
  const digits = raw.replace(/[^0-9]/g, "");
  return digits ? parseInt(digits, 10) : 0;
}

// ============ Daftar tab spreadsheet (dinamis via API, fallback statis) ============

type SheetTab = { title: string; sheetId: number };
type ResolvedTab = { gid: string; year: number };

/** Cache per proses -- daftar tab jarang berubah (paling banter setahun
 * sekali), jadi aman di-cache selama instance server hidup. */
let tabListCache: SheetTab[] | null = null;

async function listSheetTabs(): Promise<SheetTab[]> {
  if (tabListCache) return tabListCache;
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.get({
    spreadsheetId: SHEET_ID,
    fields: "sheets.properties",
  });
  tabListCache = (res.data.sheets ?? [])
    .map((s) => ({ title: s.properties?.title ?? "", sheetId: s.properties?.sheetId ?? 0 }))
    .filter((s) => s.title);
  return tabListCache;
}

async function resolveTabsByPattern(pattern: RegExp, fallback: ResolvedTab[]): Promise<ResolvedTab[]> {
  if (!isGoogleSheetsConfigured()) return fallback;
  try {
    const tabs = await listSheetTabs();
    const matched = tabs
      .map((t) => {
        const m = t.title.match(pattern);
        return m ? { gid: String(t.sheetId), year: parseInt(m[1], 10) } : null;
      })
      .filter((t): t is ResolvedTab => t !== null)
      .sort((a, b) => a.year - b.year);
    return matched.length > 0 ? matched : fallback;
  } catch {
    return fallback;
  }
}

async function resolveTotalKeuanganGid(): Promise<string> {
  if (isGoogleSheetsConfigured()) {
    try {
      const tabs = await listSheetTabs();
      const match = tabs.find((t) => t.title.trim().toLowerCase() === "total keuangan");
      if (match) return String(match.sheetId);
    } catch {
      // jatuh ke fallback di bawah
    }
  }
  return FALLBACK_TOTAL_KEUANGAN_GID;
}

// ============ Rekapitulasi transaksi (ledger) ============

export type ParsedTx = {
  date: Date;
  type: "MASUK" | "KELUAR";
  category: string;
  amount: number;
  description: string;
};

function extractYearTransactions(rows: string[][], yearFallback: number): ParsedTx[] {
  const results: ParsedTx[] = [];
  let cursorDate = new Date(yearFallback, 0, 1);
  let headerSeen = false;

  for (const cols of rows) {
    const [no, date, tujuan, keterangan, masuk, keluar] = [
      (cols[0] ?? "").trim(), (cols[1] ?? "").trim(), (cols[2] ?? "").trim(),
      (cols[3] ?? "").trim(), (cols[4] ?? "").trim(), (cols[5] ?? "").trim(),
    ];

    if (no === "No" && date === "Date") { headerSeen = true; continue; }
    if (!headerSeen) continue;

    const noLower = no.toLowerCase();
    const ketLower = keterangan.toLowerCase();
    // Baris subtotal "Jumlah"/"Saldo <Bulan>" HANYA muncul di kolom No.
    // (Sengaja tidak mengecek kolom Keterangan — beberapa transaksi asli
    // memang diawali kata "saldo", mis. "saldo kas (LPJ Februari 2024)",
    // dan itu transaksi sungguhan yang harus tetap dihitung.)
    if (noLower === "jumlah" || ketLower === "jumlah") continue;
    if (noLower.startsWith("saldo")) continue;
    if (!keterangan && !masuk && !keluar) continue;
    if (!masuk && !keluar) continue;

    if (date) cursorDate = parseIndoDate(date, yearFallback, cursorDate);

    const amountMasuk = parseRupiah(masuk);
    const amountKeluar = parseRupiah(keluar);
    const category = resolveCategory(tujuan, keterangan);

    if (amountMasuk > 0) {
      results.push({ date: cursorDate, type: "MASUK", category, amount: amountMasuk, description: keterangan || "(tanpa keterangan)" });
    } else if (amountKeluar > 0) {
      results.push({ date: cursorDate, type: "KELUAR", category, amount: amountKeluar, description: keterangan || "(tanpa keterangan)" });
    }
  }
  return results;
}

async function fetchCsv(gid: string): Promise<string> {
  const res = await fetch(
    `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${gid}`,
    { cache: "no-store" }
  );
  if (!res.ok) throw new Error(`Gagal mengambil sheet gid=${gid}: HTTP ${res.status}`);
  return res.text();
}

/** Fallback untuk tab "KAS <tahun>" yang belum diketahui gid-nya (dipakai
 * hanya sebelum Google Sheets API dikonfigurasi). */
async function fetchCsvBySheetName(sheetName: string): Promise<string> {
  const res = await fetch(
    `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`,
    { cache: "no-store" }
  );
  if (!res.ok) throw new Error(`Gagal mengambil sheet "${sheetName}": HTTP ${res.status}`);
  return res.text();
}

export async function fetchAllTransactions(): Promise<ParsedTx[]> {
  const tabs = await resolveTabsByPattern(/^Rekapitulasi\s+(\d{4})$/i, FALLBACK_REKAP_TABS);
  let all: ParsedTx[] = [];
  for (const tab of tabs) {
    const csv = await fetchCsv(tab.gid);
    all = all.concat(extractYearTransactions(parseCsv(csv), tab.year));
  }
  return all;
}

// ============ Saldo resmi Bendahara ============

export type TreasurySummaryData = {
  saldoResmi: number;
  asOfLabel: string;
  cumAmount: number;
  bendaharaAmount: number;
};

/**
 * Ambil ringkasan saldo resmi dari tab "Total Keuangan". Bentuk sheet-nya
 * (kolom C) selalu: judul -> [kosong] -> label tanggal -> nominal saldo ->
 * [kosong] -> header tabel "No,Deskripsi,...". Cari baris label tanggal
 * (mengandung koma, mis. "September 8, 2026") lalu ambil baris tepat di
 * bawahnya sebagai saldo resmi.
 */
export async function fetchTreasurySummary(): Promise<TreasurySummaryData> {
  const gid = await resolveTotalKeuanganGid();
  const csv = await fetchCsv(gid);
  const rows = parseCsv(csv);

  let asOfLabel = "";
  let saldoResmi = 0;
  let cumAmount = 0;
  let bendaharaAmount = 0;

  for (let i = 0; i < rows.length; i++) {
    const cols = rows[i].map((c) => c.trim());
    const dateLike = cols.find((c) => /^[A-Za-z]+\s+\d{1,2},\s*\d{4}$/.test(c));
    if (dateLike && !asOfLabel) {
      asOfLabel = dateLike;
      const nextRow = rows[i + 1]?.map((c) => c.trim()) ?? [];
      const amountCell = nextRow.find((c) => /rp/i.test(c) || /^\d/.test(c));
      if (amountCell) saldoResmi = parseRupiah(amountCell);
    }
    if (/cum/i.test(cols[1] ?? "")) cumAmount = parseRupiah(cols[2] ?? "");
    if (/^bendahara$/i.test(cols[1] ?? "")) bendaharaAmount = parseRupiah(cols[2] ?? "");
  }

  return { saldoResmi, asOfLabel, cumAmount, bendaharaAmount };
}

// ============ Iuran bulanan per anggota ============

export type DuesMonthSummary = { month: number; totalAmount: number; paidCount: number };
export type DuesYearData = { year: number; memberCount: number; months: DuesMonthSummary[] };

/**
 * Ambil ringkasan iuran bulanan dari tab "KAS <tahun>". Bentuk sheet-nya:
 * kolom B = Nama, kolom F..Q (index 5..16, 0-based) = 12 kolom Januari s/d
 * Desember (nilai "Rp10.000" kalau sudah bayar bulan itu, kosong kalau
 * belum). Baris anggota dikenali dari kolom Nama TIDAK kosong — ini juga
 * otomatis melewati baris "1,2,...,12" (label nomor bulan, muncul di
 * beberapa tahun) dan baris total di paling bawah, karena keduanya punya
 * kolom Nama kosong.
 */
function extractDuesSummary(rows: string[][], year: number): DuesYearData {
  const months: DuesMonthSummary[] = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    totalAmount: 0,
    paidCount: 0,
  }));
  let memberCount = 0;
  let headerSeen = false;

  for (const cols of rows) {
    const name = (cols[1] ?? "").trim();
    if (!headerSeen) {
      if (name.toLowerCase() === "nama") headerSeen = true;
      continue;
    }
    if (!name) continue; // lewati baris label nomor bulan & baris total

    memberCount += 1;
    for (let m = 0; m < 12; m++) {
      const amount = parseRupiah(cols[DUES_MONTH_START_COL + m] ?? "");
      if (amount > 0) {
        months[m].totalAmount += amount;
        months[m].paidCount += 1;
      }
    }
  }

  return { year, memberCount, months };
}

export async function fetchAllDues(): Promise<DuesYearData[]> {
  const tabs = await resolveTabsByPattern(/^KAS\s+(\d{4})$/i, []);
  const results: DuesYearData[] = [];

  if (tabs.length > 0) {
    for (const tab of tabs) {
      const csv = await fetchCsv(tab.gid);
      results.push(extractDuesSummary(parseCsv(csv), tab.year));
    }
    return results;
  }

  // Belum ada Google Sheets API -- pakai daftar nama statis sebagai fallback.
  for (const sheet of FALLBACK_DUES_NAMES) {
    const csv = await fetchCsvBySheetName(sheet.name);
    results.push(extractDuesSummary(parseCsv(csv), sheet.year));
  }
  return results;
}

// ============ Tambah anggota baru ke tab "KAS <tahun berjalan>" ============

function formatJoinLabel(date: Date): string {
  return `${MONTH_SHORT_ID[date.getMonth()]} '${String(date.getFullYear()).slice(-2)}`;
}

export type AppendMemberResult = { synced: boolean; reason?: string };

/**
 * Dipanggil saat ada anggota baru mendaftar di web (/api/register). Cari
 * tab "KAS <tahun ini>", sisipkan 1 baris baru tepat di atas baris total
 * (mewarisi FORMAT + FORMULA dari baris anggota terakhir supaya kolom
 * target/status ikut kehitung otomatis), lalu isi No/Nama/Bergabung dan
 * kosongkan 12 kolom bulan (anggota baru belum bayar apa-apa).
 *
 * Gagal secara "graceful" (return {synced:false, reason}) kalau API belum
 * dikonfigurasi atau tab tahun ini belum dibuat Bendahara -- TIDAK pernah
 * melempar error ke pemanggil, supaya pendaftaran anggota tetap berhasil
 * walau sinkron ke sheet gagal.
 */
export async function appendMemberToKasSheet(name: string, joinDate: Date): Promise<AppendMemberResult> {
  if (!isGoogleSheetsConfigured()) {
    return { synced: false, reason: "Google Sheets API belum dikonfigurasi." };
  }

  const currentYear = joinDate.getFullYear();
  let tabs: SheetTab[];
  try {
    tabs = await listSheetTabs();
  } catch (err) {
    return {
      synced: false,
      reason: `Gagal membaca daftar tab spreadsheet: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  const targetTab = tabs.find((t) => new RegExp(`^KAS\\s+${currentYear}$`, "i").test(t.title));
  if (!targetTab) {
    return { synced: false, reason: `Tab "KAS ${currentYear}" belum ada di spreadsheet.` };
  }

  const sheets = getSheetsClient();

  let rows: string[][];
  try {
    const valuesRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `'${targetTab.title}'!A:T`,
    });
    rows = (valuesRes.data.values ?? []) as string[][];
  } catch (err) {
    return {
      synced: false,
      reason: `Gagal membaca isi tab "${targetTab.title}": ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  const headerIndex = rows.findIndex((r) => (r[1] ?? "").trim().toLowerCase() === "nama");
  if (headerIndex === -1) {
    return { synced: false, reason: `Tidak menemukan header "Nama" di tab "${targetTab.title}".` };
  }

  const footerRowIndex = rows.length - 1;
  const lastMemberRowIndex = footerRowIndex - 1;
  if (lastMemberRowIndex <= headerIndex) {
    return { synced: false, reason: `Tab "${targetTab.title}" belum punya baris anggota sebagai acuan format.` };
  }

  const lastNoDigits = (rows[lastMemberRowIndex][0] ?? "").replace(/[^0-9]/g, "");
  const nextNo = lastNoDigits ? parseInt(lastNoDigits, 10) + 1 : lastMemberRowIndex - headerIndex;

  try {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: {
        requests: [
          {
            insertDimension: {
              range: { sheetId: targetTab.sheetId, dimension: "ROWS", startIndex: footerRowIndex, endIndex: footerRowIndex + 1 },
              inheritFromBefore: true,
            },
          },
          {
            copyPaste: {
              source: {
                sheetId: targetTab.sheetId,
                startRowIndex: lastMemberRowIndex,
                endRowIndex: lastMemberRowIndex + 1,
                startColumnIndex: 0,
                endColumnIndex: 20,
              },
              destination: {
                sheetId: targetTab.sheetId,
                startRowIndex: footerRowIndex,
                endRowIndex: footerRowIndex + 1,
                startColumnIndex: 0,
                endColumnIndex: 20,
              },
              pasteType: "PASTE_FORMULA",
            },
          },
        ],
      },
    });

    const newRowNum = footerRowIndex + 1; // 1-based, untuk referensi range A1
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `'${targetTab.title}'!A${newRowNum}:B${newRowNum}`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [[String(nextNo), name]] },
    });
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `'${targetTab.title}'!D${newRowNum}`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [[formatJoinLabel(joinDate)]] },
    });
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `'${targetTab.title}'!F${newRowNum}:Q${newRowNum}`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [Array(12).fill("")] },
    });
  } catch (err) {
    return {
      synced: false,
      reason: `Gagal menulis baris anggota baru: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  return { synced: true };
}
