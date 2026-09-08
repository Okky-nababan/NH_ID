import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/api-auth";
import { cashPaymentSchema } from "@/lib/validation";
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
  const parsed = cashPaymentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Data tidak valid", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const data = parsed.data;
  const before = await prisma.cashPayment.findUnique({ where: { id } });
  if (!before) {
    return NextResponse.json({ error: "Transaksi tidak ditemukan" }, { status: 404 });
  }

  const payment = await prisma.cashPayment.update({
    where: { id },
    data: {
      amount: data.amount,
      status: data.status,
      method: data.method,
      notes: data.notes || null,
      paymentDate: data.paymentDate ? new Date(data.paymentDate) : null,
      recordedById: session!.user.id,
    },
    include: { user: { select: { name: true } } },
  });

  await logAudit({
    userId: session!.user.id,
    action: "UPDATE_CASH_PAYMENT",
    module: "cash_payment",
    recordId: payment.id,
    description: `Mengubah status pembayaran kas ${payment.user.name} dari ${before.status} menjadi ${payment.status}`,
    request,
  });

  return NextResponse.json({ payment });
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
  const payment = await prisma.cashPayment.delete({
    where: { id },
    include: { user: { select: { name: true } } },
  });

  await logAudit({
    userId: session!.user.id,
    action: "DELETE_CASH_PAYMENT",
    module: "cash_payment",
    recordId: id,
    description: `Membatalkan/menghapus catatan pembayaran kas ${payment.user.name}`,
    request,
  });

  return NextResponse.json({ success: true });
}
