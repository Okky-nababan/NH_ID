import { prisma } from "@/lib/prisma";
import { looseNameMatch } from "@/lib/name-match";
import type { DuesYearDetail } from "@/lib/sheet-sync";

/**
 * Sinkronisasi iuran bulanan PER ANGGOTA dari tab "KAS <tahun>" spreadsheet
 * ke tabel CashPayment (dipakai halaman "Kas Saya" dan "Uang Kas"). Setiap
 * baris nama di sheet dicocokkan ke akun anggota terdaftar lewat
 * `looseNameMatch` (lihat name-match.ts) -- sama seperti pencocokan
 * Kepengurusan.
 *
 * Provenance: baris hasil sinkron ditandai `syncedFromSheet: true` dan
 * ditimpa ulang total tiap sinkron; catatan yang dimasukkan manual oleh
 * Bendahara lewat form "Catat Pembayaran Kas" (`syncedFromSheet: false`)
 * TIDAK PERNAH disentuh, dan kalau ada bentrok bulan yang sama, entri
 * manual itu yang menang (baris sinkron untuk kombinasi itu dilewati).
 */

type MinimalUser = { id: string; name: string; joinedAt: Date };

/**
 * Untuk satu baris nama di sheet, cari akun anggota yang cocok. Return
 * akun tunggal, atau null kalau tidak ada / ambigu (cocok >1 akun berbeda).
 */
function resolveUserForRow(rowName: string, users: MinimalUser[]): MinimalUser | "AMBIGUOUS" | null {
  const matches = users.filter((u) => looseNameMatch(rowName, u.name));
  if (matches.length === 0) return null;
  if (matches.length > 1) return "AMBIGUOUS";
  return matches[0];
}

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

  // Tanggal bergabung PALING AWAL yang terparsing dari sheet, per akun --
  // tanggal bergabung itu fakta historis tetap, jadi label paling awal
  // yang paling mendekati kebenaran.
  const earliestJoinFromSheet = new Map<string, Date>();
  // Akun yang namanya muncul di sheet tahun manapun (dengan/tanpa kolom
  // "Bergabung" terparsing) -- dipakai untuk kasus kolom kosong.
  const usersSeenInSheet = new Set<string>();

  for (const yearData of duesDetail) {
    for (const row of yearData.rows) {
      const resolved = resolveUserForRow(row.name, allUsers);
      if (resolved === null) {
        skippedNoAccount += 1;
        continue;
      }
      if (resolved === "AMBIGUOUS") {
        skippedAmbiguous += 1;
        continue;
      }
      const user = resolved;
      usersSeenInSheet.add(user.id);
      if (row.joinedAt) {
        const existing = earliestJoinFromSheet.get(user.id);
        if (!existing || row.joinedAt < existing) earliestJoinFromSheet.set(user.id, row.joinedAt);
      }
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

  // Sinkron tanggal bergabung ke User.joinedAt -- dipakai untuk membedakan
  // "belum bergabung" vs "belum bayar" di halaman Kas Saya, dan supaya
  // Profil Saya menampilkan tanggal yang sesuai catatan resmi Bendahara.
  //
  // PENTING: kolom "Bergabung" KOSONG di sheet berarti "sudah anggota
  // sejak SEBELUM sheet ini mulai dicatat" (anggota lama) -- BUKAN "belum
  // bergabung". Untuk kasus ini, tanggal bergabung diset ke 1 Januari
  // tahun paling awal yang ada di sheet -- HANYA kalau itu memundurkan
  // tanggal (tidak pernah memajukan tanggal yang sudah benar/lebih awal).
  const earliestSheetYear = Math.min(...years);
  const longtimeMemberSentinel = new Date(Date.UTC(earliestSheetYear, 0, 1));

  let joinDatesUpdated = 0;
  for (const user of allUsers) {
    const parsedJoinedAt = earliestJoinFromSheet.get(user.id);
    if (parsedJoinedAt) {
      if (user.joinedAt.getTime() !== parsedJoinedAt.getTime()) {
        await prisma.user.update({ where: { id: user.id }, data: { joinedAt: parsedJoinedAt } });
        joinDatesUpdated += 1;
      }
      continue;
    }
    if (usersSeenInSheet.has(user.id) && user.joinedAt > longtimeMemberSentinel) {
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
