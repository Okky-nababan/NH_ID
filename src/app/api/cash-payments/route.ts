import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/api-auth";
import { cashPaymentSchema } from "@/lib/validation";
import { logAudit } from "@/lib/audit";

/** Daftar iuran seluruh anggota — hanya untuk pengurus/bendahara/admin. */
export async function GET(request: Request) {
  const { error } = await requirePermission(
    "VIEW_CASH_REPORT",
    "Anda tidak memiliki izin untuk melihat data kas."
  );
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month");
  const year = searchParams.get("year");

  const payments = await prisma.cashPayment.findMany({
    where: {
      ...(month ? { month: Number(month) } : {}),
      ...(year ? { year: Number(year) } : {}),
    },
    include: {
      user: { select: { id: true, name: true, memberNumber: true } },
      recordedBy: { select: { id: true, name: true } },
    },
    orderBy: [{ year: "desc" }, { month: "desc" }, { user: { name: "asc" } }],
  });

  return NextResponse.json({ payments });
}

/** Catat/perbarui pembayaran kas — HANYA user dengan izin MANAGE_CASH_PAYMENT. */
export async function POST(request: Request) {
  const { session, error } = await requirePermission(
    "MANAGE_CASH_PAYMENT",
    "Anda tidak memiliki izin untuk mengelola pembayaran kas."
  );
  if (error) return error;

  const body = await request.json().catch(() => null);
  const parsed = cashPaymentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Data tidak valid", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const data = parsed.data;

  const payment = await prisma.cashPayment.upsert({
    where: { userId_month_year: { userId: data.userId, month: data.month, year: data.year } },
    update: {
      amount: data.amount,
      status: data.status,
      method: data.method,
      notes: data.notes || null,
      paymentDate: data.paymentDate ? new Date(data.paymentDate) : null,
      recordedById: session!.user.id,
    },
    create: {
      userId: data.userId,
      month: data.month,
      year: data.year,
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
    action: "RECORD_CASH_PAYMENT",
    module: "cash_payment",
    recordId: payment.id,
    description: `Mencatat pembayaran kas ${payment.user.name} bulan ${data.month}/${data.year} — status ${payment.status}`,
    request,
  });

  return NextResponse.json({ payment }, { status: 201 });
}
