import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { ensureRoutineActivities } from "@/lib/recurring-activity";
import { logAudit } from "@/lib/audit";

/**
 * Buat jadwal kegiatan rutin Selasa & Jumat yang belum ada (60 hari ke
 * depan dari hari ini). Dipicu dari 2 jalur:
 * 1. Manual (POST): tombol "Buat Jadwal Rutin" di halaman /kegiatan
 *    (perlu login + permission MANAGE_ACTIVITIES).
 * 2. Otomatis (GET): cron harian Vercel (lihat vercel.json) -- supaya
 *    jadwal Selasa/Jumat tidak pernah ketinggalan walau tidak ada
 *    pengurus yang membuatnya manual bulan itu.
 */
export async function POST(request: Request) {
  const { session, error } = await requirePermission(
    "MANAGE_ACTIVITIES",
    "Anda tidak memiliki izin untuk mengelola kegiatan."
  );
  if (error) return error;

  const result = await ensureRoutineActivities({ createdById: session!.user.id });

  if (result.created > 0) {
    await logAudit({
      userId: session!.user.id,
      action: "GENERATE_ROUTINE_ACTIVITIES",
      module: "activity",
      description: `Membuat ${result.created} jadwal kegiatan rutin Selasa/Jumat: ${result.createdDates.join(", ")}`,
      request,
    });
  }

  return NextResponse.json(result);
}

/** Dipanggil otomatis oleh cron Vercel (lihat vercel.json). */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const isAuthorizedCron =
    !!process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`;
  if (!isAuthorizedCron) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await ensureRoutineActivities();

  if (result.created > 0) {
    await logAudit({
      userId: null,
      action: "GENERATE_ROUTINE_ACTIVITIES",
      module: "activity",
      description: `Membuat ${result.created} jadwal kegiatan rutin Selasa/Jumat: ${result.createdDates.join(", ")} [otomatis/cron]`,
      request,
    });
  }

  return NextResponse.json(result);
}
