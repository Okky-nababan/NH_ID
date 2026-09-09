import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";
import { backfillAllPositionLinks } from "@/lib/position-sync";

/**
 * Tombol "Sinkronkan Nama dengan Anggota" di halaman Kepengurusan. Cocokkan
 * ulang SEMUA jabatan yang belum terhubung ke akun terhadap SEMUA anggota
 * terdaftar saat ini -- memperbaiki data lama (anggota yang sudah lebih
 * dulu daftar sebelum jabatannya dicatat, atau namanya beda kapitalisasi).
 */
export async function POST(request: Request) {
  const { session, error } = await requirePermission(
    "MANAGE_POSITIONS",
    "Anda tidak memiliki izin untuk mengelola kepengurusan."
  );
  if (error) return error;

  const result = await backfillAllPositionLinks();

  await logAudit({
    userId: session!.user.id,
    action: "SYNC_POSITION_NAMES",
    module: "position",
    description: `Sinkron nama kepengurusan dengan anggota: ${result.linked} jabatan terhubung${
      result.details.length > 0 ? ` (${result.details.join(", ")})` : ""
    }`,
    request,
  });

  return NextResponse.json(result);
}
