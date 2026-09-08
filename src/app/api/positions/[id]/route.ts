import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/api-auth";
import { positionSchema } from "@/lib/validation";
import { logAudit } from "@/lib/audit";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requirePermission(
    "MANAGE_POSITIONS",
    "Anda tidak memiliki izin untuk mengelola kepengurusan."
  );
  if (error) return error;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = positionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Data tidak valid", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const data = parsed.data;

  const position = await prisma.position.update({
    where: { id },
    data: {
      title: data.title,
      userId: data.userId,
      periodId: data.periodId,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
      status: data.status,
      order: data.order ?? 0,
    },
    include: { user: { select: { name: true } } },
  });

  await logAudit({
    userId: session!.user.id,
    action: "UPDATE_POSITION",
    module: "position",
    recordId: position.id,
    description: `Mengubah jabatan ${position.user.name}: ${position.title}`,
    request,
  });

  return NextResponse.json({ position });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requirePermission(
    "MANAGE_POSITIONS",
    "Anda tidak memiliki izin untuk mengelola kepengurusan."
  );
  if (error) return error;

  const { id } = await params;
  const position = await prisma.position.delete({
    where: { id },
    include: { user: { select: { name: true } } },
  });

  await logAudit({
    userId: session!.user.id,
    action: "DELETE_POSITION",
    module: "position",
    recordId: id,
    description: `Menghapus jabatan ${position.user.name}: ${position.title}`,
    request,
  });

  return NextResponse.json({ success: true });
}
