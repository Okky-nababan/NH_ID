import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, requirePermission } from "@/lib/api-auth";
import { managementPeriodSchema } from "@/lib/validation";
import { logAudit } from "@/lib/audit";

export async function GET() {
  const { error } = await requireUser();
  if (error) return error;

  const periods = await prisma.managementPeriod.findMany({
    orderBy: { startYear: "desc" },
  });

  return NextResponse.json({ periods });
}

export async function POST(request: Request) {
  const { session, error } = await requirePermission(
    "MANAGE_PERIODS",
    "Anda tidak memiliki izin untuk mengelola periode kepengurusan."
  );
  if (error) return error;

  const body = await request.json().catch(() => null);
  const parsed = managementPeriodSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Data tidak valid", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const data = parsed.data;

  // Hanya boleh ada satu periode aktif pada satu waktu.
  const period = await prisma.$transaction(async (tx) => {
    if (data.isActive) {
      await tx.managementPeriod.updateMany({ data: { isActive: false }, where: {} });
    }
    return tx.managementPeriod.create({
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
    action: "CREATE_PERIOD",
    module: "period",
    recordId: period.id,
    description: `Membuat periode kepengurusan: ${period.name}`,
    request,
  });

  return NextResponse.json({ period }, { status: 201 });
}
