import { prisma } from "@/lib/prisma";
import { firstTwoWordsKey as matchKey } from "@/lib/name-match";

/**
 * Sinkronisasi otomatis antara jabatan kepengurusan (`Position.memberName`,
 * teks bebas untuk pengurus yang belum tentu punya akun) dengan akun
 * anggota terdaftar (`User`). Begitu ada akun anggota yang namanya cocok
 * dengan `memberName` sebuah jabatan yang belum terhubung, jabatan itu
 * otomatis di-link (`Position.userId` diisi) -- foto profil & tautan ke
 * halaman anggota langsung muncul di halaman Kepengurusan tanpa perlu
 * Admin mengedit manual satu-satu.
 */

/**
 * Dipanggil setiap ada anggota baru terdaftar (lewat /api/register atau
 * /api/members). Cari jabatan yang belum terhubung ke akun mana pun tapi
 * `memberName`-nya cocok (2 kata pertama) dengan nama anggota baru ini,
 * lalu hubungkan. Tidak pernah melempar error ke pemanggil -- kegagalan di
 * sini tidak boleh menggagalkan pendaftaran anggota.
 */
export async function linkPositionsForNewUser(userId: string, userName: string): Promise<number> {
  try {
    const target = matchKey(userName);
    const unlinked = await prisma.position.findMany({
      where: { userId: null, memberName: { not: null } },
      select: { id: true, memberName: true },
    });
    const matchIds = unlinked
      .filter((p) => p.memberName && matchKey(p.memberName) === target)
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
 * terhadap SEMUA akun anggota yang sudah terdaftar (2 kata nama pertama).
 * Dipakai untuk memperbaiki data lama -- dipicu lewat tombol "Sinkronkan
 * Nama dengan Anggota" di halaman Kepengurusan, atau lewat script sekali
 * jalan. Kalau 2 kata pertama cocok dengan LEBIH DARI SATU akun berbeda,
 * jabatan itu dilewati (tidak ditebak sembarangan) -- Admin perlu
 * menghubungkan manual lewat Edit.
 */
export async function backfillAllPositionLinks(): Promise<BackfillResult> {
  const [unlinkedPositions, allUsers] = await Promise.all([
    prisma.position.findMany({
      where: { userId: null, memberName: { not: null } },
      select: { id: true, memberName: true },
    }),
    prisma.user.findMany({ select: { id: true, name: true } }),
  ]);

  const usersByKey = new Map<string, typeof allUsers>();
  for (const u of allUsers) {
    const key = matchKey(u.name);
    const list = usersByKey.get(key) ?? [];
    list.push(u);
    usersByKey.set(key, list);
  }

  const details: string[] = [];
  let linked = 0;
  for (const pos of unlinkedPositions) {
    if (!pos.memberName) continue;
    const candidates = usersByKey.get(matchKey(pos.memberName)) ?? [];
    if (candidates.length === 0) continue;
    if (candidates.length > 1) {
      details.push(
        `${pos.memberName} -> dilewati (cocok dengan ${candidates.length} akun berbeda: ${candidates
          .map((c) => c.name)
          .join(", ")})`
      );
      continue;
    }
    const match = candidates[0];
    await prisma.position.update({ where: { id: pos.id }, data: { userId: match.id } });
    linked += 1;
    details.push(`${pos.memberName} -> ${match.name}`);
  }

  return { linked, details };
}
