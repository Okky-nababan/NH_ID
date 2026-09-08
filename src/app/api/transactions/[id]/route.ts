import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/api-auth";
import { transactionSchema } from "@/lib/validation";
import { logAudit } from "@/lib/audit";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requirePermission(
    "MANAGE_CASH_PAYMENT",
    "Anda tidak memiliki izin untuk mengelola pembayaran kas."
  );
  if (error) return error;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = transactionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Data tidak valid", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { type, category, amount, description, date, userId } = parsed.data;

  const transaction = await prisma.transaction.update({
    where: { id },
    data: {
      type,
      category,
      amount,
      description: description || null,
      date: new Date(date),
      userId: userId || null,
    },
  });

  await logAudit({
    userId: session!.user.id,
    action: "UPDATE_TRANSACTION",
    module: "transaction",
    recordId: transaction.id,
    description: `Mengubah transaksi: ${category} — Rp${amount}`,
    request,
  });

  return NextResponse.json({ transaction });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requirePermission(
    "MANAGE_CASH_PAYMENT",
    "Anda tidak memiliki izin untuk mengelola pembayaran kas."
  );
  if (error) return error;

  const { id } = await params;
  const transaction = await prisma.transaction.delete({ where: { id } });

  await logAudit({
    userId: session!.user.id,
    action: "DELETE_TRANSACTION",
    module: "transaction",
    recordId: id,
    description: `Menghapus transaksi: ${transaction.category}`,
    request,
  });

  return NextResponse.json({ success: true });
}
