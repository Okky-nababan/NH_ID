import { prisma } from "@/lib/prisma";
import { firstTwoWordsKey } from "@/lib/name-match";
import type { DuesYearDetail } from "@/lib/sheet-sync";

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
};

export async function syncCashPaymentsFromSheet(
  duesDetail: DuesYearDetail[]
): Promise<CashPaymentSyncResult> {
  const years = duesDetail.map((d) => d.year);
  if (years.length === 0) {
    return { created: 0, skippedNoAccount: 0, skippedAmbiguous: 0, skippedManualOverride: 0 };
  }

  const [allUsers, manualPayments] = await Promise.all([
    prisma.user.findMany({ select: { id: true, name: true } }),
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

  return { created: toCreate.length, skippedNoAccount, skippedAmbiguous, skippedManualOverride };
}
