import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/api-auth";
import { transactionSchema } from "@/lib/validation";
import { logAudit } from "@/lib/audit";

export async function GET() {
  const { error } = await requirePermission(
    "VIEW_CASH_REPORT",
    "Anda tidak memiliki izin untuk melihat data kas."
  );
  if (error) return error;

  const transactions = await prisma.transaction.findMany({
    orderBy: { date: "desc" },
    include: { user: { select: { id: true, name: true } } },
  });

  return NextResponse.json({ transactions });
}

export async function POST(request: Request) {
  const { session, error } = await requirePermission(
    "MANAGE_CASH_PAYMENT",
    "Anda tidak memiliki izin untuk mengelola pembayaran kas."
  );
  if (error) return error;

  const body = await request.json().catch(() => null);
  const parsed = transactionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Data tidak valid", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { type, category, amount, description, date, userId } = parsed.data;

  const transaction = await prisma.transaction.create({
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
    action: "CREATE_TRANSACTION",
    module: "transaction",
    recordId: transaction.id,
    description: `Menambahkan transaksi ${type === "MASUK" ? "pemasukan" : "pengeluaran"}: ${category} — Rp${amount}`,
    request,
  });

  return NextResponse.json({ transaction }, { status: 201 });
}
