import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/api-auth";

export async function GET() {
  const { error } = await requirePermission(
    "VIEW_AUDIT_LOG",
    "Anda tidak memiliki izin untuk melihat audit log."
  );
  if (error) return error;

  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 300,
    include: { user: { select: { name: true } } },
  });

  return NextResponse.json({ logs });
}
