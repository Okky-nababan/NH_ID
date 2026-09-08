import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/api-auth";
import { attendanceBulkSchema } from "@/lib/validation";
import { logAudit } from "@/lib/audit";

/** Input massal kehadiran oleh pengurus/admin — bukan self-service RSVP. */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requirePermission(
    "MANAGE_ATTENDANCE",
    "Anda tidak memiliki izin untuk mengelola kehadiran."
  );
  if (error) return error;

  const { id: activityId } = await params;
  const activity = await prisma.activity.findUnique({ where: { id: activityId } });
  if (!activity) {
    return NextResponse.json({ error: "Kegiatan tidak ditemukan" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = attendanceBulkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Data tidak valid", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const results = await prisma.$transaction(
    parsed.data.entries.map((entry) =>
      prisma.attendance.upsert({
        where: { activityId_userId: { activityId, userId: entry.userId } },
        update: { status: entry.status, recordedById: session!.user.id },
        create: {
          activityId,
          userId: entry.userId,
          status: entry.status,
          recordedById: session!.user.id,
        },
      })
    )
  );

  await logAudit({
    userId: session!.user.id,
    action: "RECORD_ATTENDANCE",
    module: "attendance",
    recordId: activityId,
    description: `Mencatat kehadiran ${results.length} anggota untuk kegiatan "${activity.name}"`,
    request,
  });

  return NextResponse.json({ count: results.length });
}
