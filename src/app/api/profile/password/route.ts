import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api-auth";
import { changePasswordSchema } from "@/lib/validation";
import { logAudit } from "@/lib/audit";

/**
 * Satu-satunya bagian biodata yang boleh diubah anggota sendiri: password.
 * Semua field biodata lain (nama, telepon, alamat, tanggal lahir, marga
 * ibu, dll) hanya bisa diubah Admin/Pengurus lewat /anggota/[id]/edit --
 * anggota yang ingin biodatanya diubah harus mengajukan permintaan lewat
 * /api/profile-edit-requests.
 */
export async function POST(request: Request) {
  const { session, error } = await requireUser();
  if (error) return error;

  const body = await request.json().catch(() => null);
  const parsed = changePasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Data tidak valid", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const userId = session!.user.id;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    // Override default omit global (lihat lib/prisma.ts) -- perlu hash-nya
    // untuk verifikasi password saat ini sebelum diganti.
    omit: { passwordHash: false },
  });
  if (!user) {
    return NextResponse.json({ error: "Akun tidak ditemukan" }, { status: 404 });
  }

  const isCurrentPasswordValid = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
  if (!isCurrentPasswordValid) {
    return NextResponse.json({ error: "Password saat ini salah" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 10);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });

  await logAudit({
    userId,
    action: "CHANGE_OWN_PASSWORD",
    module: "user",
    recordId: userId,
    description: `${user.name} mengganti password sendiri`,
    request,
  });

  return NextResponse.json({ success: true });
}
