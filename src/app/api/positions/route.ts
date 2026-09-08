import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, requirePermission } from "@/lib/api-auth";
import { positionSchema } from "@/lib/validation";
import { logAudit } from "@/lib/audit";

export async function GET(request: Request) {
  const { error } = await requireUser();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const periodId = searchParams.get("periodId") || undefined;

  const positions = await prisma.position.findMany({
    where: periodId ? { periodId } : undefined,
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    include: {
      user: { select: { id: true, name: true, photoUrl: true } },
      period: { select: { id: true, name: true, isActive: true } },
    },
  });

  return NextResponse.json({ positions });
}

export async function POST(request: Request) {
  const { session, error } = await requirePermission(
    "MANAGE_POSITIONS",
    "Anda tidak memiliki izin untuk mengelola kepengurusan."
  );
  if (error) return error;

  const body = await request.json().catch(() => null);
  const parsed = positionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Data tidak valid", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const data = parsed.data;

  const position = await prisma.position.create({
    data: {
      title: data.title,
      userId: data.userId || null,
      memberName: data.userId ? null : data.memberName || null,
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
    action: "CREATE_POSITION",
    module: "position",
    recordId: position.id,
    description: `Menetapkan ${position.user?.name ?? position.memberName} sebagai ${position.title}`,
    request,
  });

  return NextResponse.json({ position }, { status: 201 });
}
