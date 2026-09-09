import { prisma } from "@/lib/prisma";
import { firstTwoWordsKey } from "@/lib/name-match";
import type { DuesYearDetail } from "@/lib/sheet-sync";

/**
 * Ambil semua tanggal bergabung yang berhasil diparsing dari sheet, ambil
 * yang PALING AWAL per anggota (kalau namanya muncul di beberapa tahun
 * dengan label berbeda) -- tanggal bergabung itu fakta historis tetap,
 * jadi label paling awal yang paling mendekati kebenaran.
 */
function collectEarliestJoinDates(duesDetail: DuesYearDetail[]): Map<string, Date> {
  const byNameKey = new Map<string, Date>();
  for (const yearData of duesDetail) {
    for (const row of yearData.rows) {
      if (!row.joinedAt) continue;
      const key = firstTwoWordsKey(row.name);
      const existing = byNameKey.get(key);
      if (!existing || row.joinedAt < existing) byNameKey.set(key, row.joinedAt);
    }
  }
  return byNameKey;
}

/** Semua nama yang muncul di sheet tahun manapun (dengan/tanpa label
 * "Bergabung" terparsing) -- dipakai untuk kasus kolom kosong. */
function collectAllSheetNameKeys(duesDetail: DuesYearDetail[]): Set<string> {
  const keys = new Set<string>();
  for (const yearData of duesDetail) {
    for (const row of yearData.rows) keys.add(firstTwoWordsKey(row.name));
  }
  return keys;
}

/**
 * Sinkronisasi iuran bulanan PER ANGGOTA dari tab "KAS <tahun>" spreadsheet
 * ke tabel CashPayment (dipakai halaman "Kas Saya" dan "Uang Kas"). Setiap
 * baris nama di sheet dicocokkan ke akun anggota terdaftar dengan kunci 2
 * kata pertama (lihat name-match.ts) -- sama seperti pencocokan Kepengurusan.
 *
 * Provenance: baris hasil sinkron ditandai `syncedFromSheet: true` dan
 * ditimpa ulang total tiap sinkron; catatan yang dimasukkan manual oleh
 * Bendahara lewat form "Catat Pembayaran Kas" (`syncedFromSheet: false`)
 * TIDAK PERNAH disentuh, dan kalau ada bentrok bulan yang sama, entri
 * manual itu yang menang (baris sinkron untuk kombinasi itu dilewati).
 */

export type CashPaymentSyncResult = {
  created: number;
  skippedNoAccount: number;
  skippedAmbiguous: number;
  skippedManualOverride: number;
  joinDatesUpdated: number;
};

export async function syncCashPaymentsFromSheet(
  duesDetail: DuesYearDetail[]
): Promise<CashPaymentSyncResult> {
  const years = duesDetail.map((d) => d.year);
  if (years.length === 0) {
    return {
      created: 0,
      skippedNoAccount: 0,
      skippedAmbiguous: 0,
      skippedManualOverride: 0,
      joinDatesUpdated: 0,
    };
  }

  const [allUsers, manualPayments] = await Promise.all([
    prisma.user.findMany({ select: { id: true, name: true, joinedAt: true } }),
    prisma.cashPayment.findMany({
      where: { syncedFromSheet: false, year: { in: years } },
      select: { userId: true, month: true, year: true },
    }),
  ]);

  const usersByKey = new Map<string, typeof allUsers>();
  for (const u of allUsers) {
    const key = firstTwoWordsKey(u.name);
    const list = usersByKey.get(key) ?? [];
    list.push(u);
    usersByKey.set(key, list);
  }
  const manualKeys = new Set(manualPayments.map((p) => `${p.userId}-${p.month}-${p.year}`));

  let skippedNoAccount = 0;
  let skippedAmbiguous = 0;
  let skippedManualOverride = 0;
  const toCreate: {
    userId: string;
    month: number;
    year: number;
    amount: number;
    status: "LUNAS";
    syncedFromSheet: true;
  }[] = [];

  for (const yearData of duesDetail) {
    for (const row of yearData.rows) {
      const candidates = usersByKey.get(firstTwoWordsKey(row.name)) ?? [];
      if (candidates.length === 0) {
        skippedNoAccount += 1;
        continue;
      }
      if (candidates.length > 1) {
        skippedAmbiguous += 1;
        continue;
      }
      const user = candidates[0];
      for (const m of row.months) {
        if (manualKeys.has(`${user.id}-${m.month}-${yearData.year}`)) {
          skippedManualOverride += 1;
          continue;
        }
        toCreate.push({
          userId: user.id,
          month: m.month,
          year: yearData.year,
          amount: m.amount,
          status: "LUNAS",
          syncedFromSheet: true,
        });
      }
    }
  }

  // Hapus dulu hasil sinkron SEBELUMNYA untuk tahun-tahun ini -- supaya
  // perubahan di sheet (mis. status batal bayar) ikut terefleksi. Entri
  // manual (syncedFromSheet=false) tidak disentuh sama sekali.
  await prisma.cashPayment.deleteMany({
    where: { syncedFromSheet: true, year: { in: years } },
  });

  if (toCreate.length > 0) {
    await prisma.cashPayment.createMany({ data: toCreate, skipDuplicates: true });
  }

  // Sinkron tanggal bergabung (kolom "Bergabung" di sheet) ke User.joinedAt
  // -- dipakai untuk membedakan "belum bergabung" vs "belum bayar" di
  // halaman Kas Saya, dan supaya Profil Saya menampilkan tanggal yang
  // sesuai dengan catatan resmi Bendahara.
  //
  // PENTING: kolom "Bergabung" KOSONG di sheet berarti "sudah anggota
  // sejak SEBELUM sheet ini mulai dicatat" (anggota lama) -- BUKAN
  // "belum bergabung". Kalau dibiarkan, User.joinedAt tetap di tanggal
  // default akun web didaftarkan (mis. hari ini), yang salah membuat
  // anggota lama terlihat baru gabung bulan ini. Untuk kasus ini,
  // tanggal bergabung diset ke 1 Januari tahun paling awal yang ada di
  // sheet -- HANYA kalau itu memundurkan tanggal (tidak pernah memajukan
  // tanggal yang sudah benar/lebih awal).
  const earliestJoinDates = collectEarliestJoinDates(duesDetail);
  const allSheetNameKeys = collectAllSheetNameKeys(duesDetail);
  const earliestSheetYear = Math.min(...years);
  const longtimeMemberSentinel = new Date(Date.UTC(earliestSheetYear, 0, 1));

  let joinDatesUpdated = 0;
  for (const [key, candidates] of usersByKey) {
    if (candidates.length !== 1) continue; // ambigu -- jangan tebak
    const user = candidates[0];

    const parsedJoinedAt = earliestJoinDates.get(key);
    if (parsedJoinedAt) {
      if (user.joinedAt.getTime() !== parsedJoinedAt.getTime()) {
        await prisma.user.update({ where: { id: user.id }, data: { joinedAt: parsedJoinedAt } });
        joinDatesUpdated += 1;
      }
      continue;
    }

    if (allSheetNameKeys.has(key) && user.joinedAt > longtimeMemberSentinel) {
      await prisma.user.update({
        where: { id: user.id },
        data: { joinedAt: longtimeMemberSentinel },
      });
      joinDatesUpdated += 1;
    }
  }

  return {
    created: toCreate.length,
    skippedNoAccount,
    skippedAmbiguous,
    skippedManualOverride,
    joinDatesUpdated,
  };
}
