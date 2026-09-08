/**
 * Sinkronisasi data keuangan dari spreadsheet Bendahara (Google Sheets) ke
 * ledger organisasi. Sumber: 3 tab "Rekapitulasi <tahun>" (transaksi rinci)
 * + tab "Total Keuangan" (ringkasan saldo resmi versi Bendahara).
 *
 * Dipakai oleh /api/kas/sync (dipicu manual dari web) dan oleh cron harian
 * (lihat vercel.json) untuk sinkronisasi otomatis berkala.
 */

const SHEET_ID = "1bGmAIjJuVn3ZLqk36cyaJ53mfK-wID8UbbCOLEClmXE";

const REKAP_TABS: { gid: string; year: number }[] = [
  { gid: "238299411", year: 2024 },
  { gid: "1261206819", year: 2025 },
  { gid: "1642026533", year: 2026 },
];
const TOTAL_KEUANGAN_GID = "1298894498";

const MONTHS: Record<string, number> = {
  januari: 1, februari: 2, maret: 3, april: 4, mei: 5, juni: 6,
  juli: 7, agustus: 8, agutstus: 8, austus: 8, september: 9,
  oktober: 10, november: 11, desember: 12,
};

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

export async function fetchAllTransactions(): Promise<ParsedTx[]> {
  let all: ParsedTx[] = [];
  for (const tab of REKAP_TABS) {
    const csv = await fetchCsv(tab.gid);
    all = all.concat(extractYearTransactions(parseCsv(csv), tab.year));
  }
  return all;
}

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
  const csv = await fetchCsv(TOTAL_KEUANGAN_GID);
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
