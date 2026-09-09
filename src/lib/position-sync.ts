import { prisma } from "@/lib/prisma";

/**
 * Sinkronisasi otomatis antara jabatan kepengurusan (`Position.memberName`,
 * teks bebas untuk pengurus yang belum tentu punya akun) dengan akun
 * anggota terdaftar (`User`). Begitu ada akun anggota yang namanya cocok
 * dengan `memberName` sebuah jabatan yang belum terhubung, jabatan itu
 * otomatis di-link (`Position.userId` diisi) -- foto profil & tautan ke
 * halaman anggota langsung muncul di halaman Kepengurusan tanpa perlu
 * Admin mengedit manual satu-satu.
 */

/** Normalisasi nama untuk pencocokan longgar -- huruf kecil semua, spasi
 * ganda dirapikan -- supaya "Okky Alexander Nababan" tetap cocok dengan
 * "okky  alexander nababan" (beda kapitalisasi/spasi). */
function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Dipanggil setiap ada anggota baru terdaftar (lewat /api/register atau
 * /api/members). Cari jabatan yang belum terhubung ke akun mana pun tapi
 * `memberName`-nya cocok dengan nama anggota baru ini, lalu hubungkan.
 * Tidak pernah melempar error ke pemanggil -- kegagalan di sini tidak
 * boleh menggagalkan pendaftaran anggota.
 */
export async function linkPositionsForNewUser(userId: string, userName: string): Promise<number> {
  try {
    const target = normalizeName(userName);
    const unlinked = await prisma.position.findMany({
      where: { userId: null, memberName: { not: null } },
      select: { id: true, memberName: true },
    });
    const matchIds = unlinked
      .filter((p) => p.memberName && normalizeName(p.memberName) === target)
      .map((p) => p.id);
    if (matchIds.length === 0) return 0;

    await prisma.position.updateMany({
      where: { id: { in: matchIds } },
      data: { userId },
    });
    return matchIds.length;
  } catch (err) {
    console.warn(`Gagal menghubungkan jabatan untuk anggota baru "${userName}":`, err);
    return 0;
  }
}

export type BackfillResult = { linked: number; details: string[] };

/**
 * Backfill sekali jalan: cocokkan SEMUA jabatan yang belum terhubung
 * terhadap SEMUA akun anggota yang sudah terdaftar. Dipakai untuk
 * memperbaiki data lama (anggota yang sudah lebih dulu daftar sebelum
 * jabatannya dicatat, atau dicatat manual dengan nama yang belum
 * di-link) -- dipicu lewat tombol "Sinkronkan Nama dengan Anggota" di
 * halaman Kepengurusan, atau lewat script sekali jalan.
 */
export async function backfillAllPositionLinks(): Promise<BackfillResult> {
  const [unlinkedPositions, allUsers] = await Promise.all([
    prisma.position.findMany({
      where: { userId: null, memberName: { not: null } },
      select: { id: true, memberName: true },
    }),
    prisma.user.findMany({ select: { id: true, name: true } }),
  ]);

  const userByNormalizedName = new Map(allUsers.map((u) => [normalizeName(u.name), u]));

  const details: string[] = [];
  let linked = 0;
  for (const pos of unlinkedPositions) {
    if (!pos.memberName) continue;
    const match = userByNormalizedName.get(normalizeName(pos.memberName));
    if (!match) continue;
    await prisma.position.update({ where: { id: pos.id }, data: { userId: match.id } });
    linked += 1;
    details.push(`${pos.memberName} -> ${match.name}`);
  }

  return { linked, details };
}
