import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, requirePermission } from "@/lib/api-auth";
import { activitySchema } from "@/lib/validation";
import { logAudit } from "@/lib/audit";

export async function GET() {
  const { error } = await requireUser();
  if (error) return error;

  const activities = await prisma.activity.findMany({
    orderBy: { date: "desc" },
    include: {
      personInCharge: { select: { id: true, name: true } },
      _count: { select: { attendances: true } },
    },
  });

  return NextResponse.json({ activities });
}

export async function POST(request: Request) {
  const { session, error } = await requirePermission(
    "MANAGE_ACTIVITIES",
    "Anda tidak memiliki izin untuk mengelola kegiatan."
  );
  if (error) return error;

  const body = await request.json().catch(() => null);
  const parsed = activitySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Data tidak valid", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const data = parsed.data;

  const activity = await prisma.activity.create({
    data: {
      name: data.name,
      type: data.type,
      description: data.description,
      date: new Date(data.date),
      location: data.location,
      personInChargeId: data.personInChargeId || null,
      status: data.status,
      notes: data.notes || null,
      photoUrl: data.photoUrl || null,
      createdById: session!.user.id,
    },
  });

  await logAudit({
    userId: session!.user.id,
    action: "CREATE_ACTIVITY",
    module: "activity",
    recordId: activity.id,
    description: `Membuat kegiatan: ${activity.name}`,
    request,
  });

  return NextResponse.json({ activity }, { status: 201 });
}
