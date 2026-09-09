import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { ensureRoutineActivities } from "@/lib/recurring-activity";
import { logAudit } from "@/lib/audit";

/**
 * Buat jadwal kegiatan rutin Selasa & Jumat yang belum ada (60 hari sejak
 * tanggal mulai). Dipicu dari 2 jalur:
 * 1. Manual (POST): tombol "Buat Jadwal Rutin" di halaman /kegiatan
 *    (perlu login + permission MANAGE_ACTIVITIES). Bisa kirim body
 *    `{ startDate: "YYYY-MM-DD" }` untuk mulai dari tanggal tertentu
 *    (termasuk tanggal yang sudah lewat) -- default: hari ini.
 * 2. Otomatis (GET): cron harian Vercel (lihat vercel.json) -- selalu
 *    mulai dari hari ini, supaya jadwal Selasa/Jumat tidak pernah
 *    ketinggalan walau tidak ada pengurus yang membuatnya manual.
 */
export async function POST(request: Request) {
  const { session, error } = await requirePermission(
    "MANAGE_ACTIVITIES",
    "Anda tidak memiliki izin untuk mengelola kegiatan."
  );
  if (error) return error;

  // startDate opsional (format YYYY-MM-DD) -- dipakai untuk menutup jadwal
  // rutin dari tanggal tertentu, termasuk tanggal yang sudah lewat.
  const body = await request.json().catch(() => ({}));
  let startDate: Date | undefined;
  if (typeof body?.startDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.startDate)) {
    const [y, m, d] = body.startDate.split("-").map(Number);
    startDate = new Date(Date.UTC(y, m - 1, d));
  }

  const result = await ensureRoutineActivities({ createdById: session!.user.id, startDate });

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
