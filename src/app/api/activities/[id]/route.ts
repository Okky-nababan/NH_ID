import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, requirePermission } from "@/lib/api-auth";
import { hasPermission } from "@/lib/permissions";
import { activitySchema } from "@/lib/validation";
import { logAudit } from "@/lib/audit";

/**
 * Privasi: kehadiran adalah data pribadi per anggota. Anggota biasa (tanpa
 * MANAGE_ATTENDANCE) hanya boleh melihat status kehadirannya SENDIRI untuk
 * kegiatan ini, bukan daftar kehadiran seluruh anggota lain.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireUser();
  if (error) return error;

  const { id } = await params;
  const activity = await prisma.activity.findUnique({
    where: { id },
    include: {
      personInCharge: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
      attendances: {
        include: { user: { select: { id: true, name: true, photoUrl: true } } },
        orderBy: { user: { name: "asc" } },
      },
    },
  });

  if (!activity) {
    return NextResponse.json({ error: "Kegiatan tidak ditemukan" }, { status: 404 });
  }

  const canSeeAll = hasPermission(session, "MANAGE_ATTENDANCE");
  if (!canSeeAll) {
    return NextResponse.json({
      activity: {
        ...activity,
        attendances: activity.attendances.filter((a) => a.userId === session!.user.id),
      },
    });
  }

  return NextResponse.json({ activity });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requirePermission(
    "MANAGE_ACTIVITIES",
    "Anda tidak memiliki izin untuk mengelola kegiatan."
  );
  if (error) return error;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = activitySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Data tidak valid", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const data = parsed.data;

  const activity = await prisma.activity.update({
    where: { id },
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
    },
  });

  await logAudit({
    userId: session!.user.id,
    action: "UPDATE_ACTIVITY",
    module: "activity",
    recordId: activity.id,
    description: `Mengubah kegiatan: ${activity.name}`,
    request,
  });

  return NextResponse.json({ activity });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requirePermission(
    "MANAGE_ACTIVITIES",
    "Anda tidak memiliki izin untuk mengelola kegiatan."
  );
  if (error) return error;

  const { id } = await params;
  const activity = await prisma.activity.delete({ where: { id } });

  await logAudit({
    userId: session!.user.id,
    action: "DELETE_ACTIVITY",
    module: "activity",
    recordId: id,
    description: `Menghapus kegiatan: ${activity.name}`,
    request,
  });

  return NextResponse.json({ success: true });
}
