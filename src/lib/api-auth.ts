import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { Permission } from "@/generated/prisma/client";

export async function requireUser() {
  const session = await auth();
  if (!session?.user) {
    return { session: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { session, error: null };
}

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user) {
    return { session: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (session.user.role !== "ADMIN") {
    return { session: null, error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { session, error: null };
}

/**
 * Verifikasi izin granular LANGSUNG ke database (bukan dari session/JWT
 * yang cuma snapshot saat login) — supaya pencabutan izin oleh admin
 * langsung berlaku tanpa menunggu user login ulang. Dipakai untuk semua
 * endpoint mutasi sensitif (kas, anggota, kegiatan, kehadiran,
 * kepengurusan, periode, user/izin).
 */
export async function requirePermission(permission: Permission, message?: string) {
  const session = await auth();
  if (!session?.user) {
    return { session: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (session.user.role === "ADMIN") {
    return { session, error: null };
  }

  const granted = await prisma.userPermission.findUnique({
    where: { userId_permission: { userId: session.user.id, permission } },
    select: { id: true },
  });

  if (!granted) {
    return {
      session: null,
      error: NextResponse.json(
        { error: message ?? "Anda tidak memiliki izin untuk melakukan tindakan ini." },
        { status: 403 }
      ),
    };
  }

  return { session, error: null };
}
