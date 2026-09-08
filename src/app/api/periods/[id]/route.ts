import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/api-auth";
import { managementPeriodSchema } from "@/lib/validation";
import { logAudit } from "@/lib/audit";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requirePermission(
    "MANAGE_PERIODS",
    "Anda tidak memiliki izin untuk mengelola periode kepengurusan."
  );
  if (error) return error;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = managementPeriodSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Data tidak valid", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const data = parsed.data;

  const period = await prisma.$transaction(async (tx) => {
    if (data.isActive) {
      await tx.managementPeriod.updateMany({
        data: { isActive: false },
        where: { id: { not: id } },
      });
    }
    return tx.managementPeriod.update({
      where: { id },
      data: {
        name: data.name,
        startYear: data.startYear,
        endYear: data.endYear,
        isActive: !!data.isActive,
        notes: data.notes || null,
      },
    });
  });

  await logAudit({
    userId: session!.user.id,
    action: "UPDATE_PERIOD",
    module: "period",
    recordId: period.id,
    description: `Mengubah periode kepengurusan: ${period.name}${period.isActive ? " (diaktifkan)" : ""}`,
    request,
  });

  return NextResponse.json({ period });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requirePermission(
    "MANAGE_PERIODS",
    "Anda tidak memiliki izin untuk mengelola periode kepengurusan."
  );
  if (error) return error;

  const { id } = await params;
  const period = await prisma.managementPeriod.delete({ where: { id } });

  await logAudit({
    userId: session!.user.id,
    action: "DELETE_PERIOD",
    module: "period",
    recordId: id,
    description: `Menghapus periode kepengurusan: ${period.name}`,
    request,
  });

  return NextResponse.json({ success: true });
}
