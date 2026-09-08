import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/api-auth";

/** Overview kehadiran lintas kegiatan — untuk halaman /kehadiran (pengurus). */
export async function GET(request: Request) {
  const { error } = await requirePermission(
    "MANAGE_ATTENDANCE",
    "Anda tidak memiliki izin untuk melihat data kehadiran."
  );
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const activityId = searchParams.get("activityId") || undefined;

  const attendances = await prisma.attendance.findMany({
    where: activityId ? { activityId } : undefined,
    include: {
      user: { select: { id: true, name: true, photoUrl: true } },
      activity: { select: { id: true, name: true, date: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return NextResponse.json({ attendances });
}
