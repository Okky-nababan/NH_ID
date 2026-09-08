import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/api-auth";

export async function GET() {
  const { error } = await requirePermission(
    "MANAGE_USERS",
    "Anda tidak memiliki izin untuk mengelola user."
  );
  if (error) return error;

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
      joinedAt: true,
      permissions: { select: { permission: true } },
    },
  });

  return NextResponse.json({
    users: users.map((u) => ({
      ...u,
      permissions: u.permissions.map((p) => p.permission),
    })),
  });
}
