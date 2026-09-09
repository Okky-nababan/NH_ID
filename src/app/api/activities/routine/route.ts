import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { ensureRoutineActivities } from "@/lib/recurring-activity";
import { logAudit } from "@/lib/audit";

/**
 * Buat jadwal kegiatan rutin Selasa & Jumat yang belum ada (60 hari sejak
 * tanggal mulai). Dipicu dari 2 jalur:
 * 1. Manual (POST): tombol "Buat Jadwal Rutin" di halaman /kegiatan
 *    (perlu login + permission MANAGE_ACTIVITIES). Bisa kirim body
 *    `{ startDate?: "YYYY-MM-DD", endDate?: "YYYY-MM-DD" }` untuk
 *    membatasi rentang tanggal (startDate boleh tanggal yang sudah
 *    lewat) -- default: hari ini s/d 60 hari ke depan.
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

  // startDate/endDate opsional (format YYYY-MM-DD) -- dipakai untuk
  // menutup jadwal rutin dari/sampai tanggal tertentu, termasuk tanggal
  // yang sudah lewat.
  const body = await request.json().catch(() => ({}));
  const parseDate = (value: unknown): Date | undefined => {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
    const [y, m, d] = value.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d));
  };
  const startDate = parseDate(body?.startDate);
  const endDate = parseDate(body?.endDate);

  const result = await ensureRoutineActivities({
    createdById: session!.user.id,
    startDate,
    endDate,
  });

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
