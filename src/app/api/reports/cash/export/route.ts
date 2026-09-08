import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/api-auth";
import { MONTH_NAMES_ID } from "@/lib/constants";

export async function GET(request: Request) {
  const { error } = await requirePermission(
    "VIEW_CASH_REPORT",
    "Anda tidak memiliki izin untuk melihat laporan kas."
  );
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const year = Number(searchParams.get("year")) || new Date().getFullYear();

  const [activeMembers, payments] = await Promise.all([
    prisma.user.count({ where: { isActive: true } }),
    prisma.cashPayment.findMany({ where: { year } }),
  ]);

  const rows = [["Bulan", "Jumlah Anggota", "Sudah Bayar", "Belum Bayar", "Total Kas"]];

  for (let month = 1; month <= 12; month++) {
    const monthPayments = payments.filter((p) => p.month === month);
    const paid = monthPayments.filter((p) => p.status === "LUNAS");
    const total = paid.reduce((sum, p) => sum + p.amount, 0);
    rows.push([
      `${MONTH_NAMES_ID[month - 1]} ${year}`,
      String(activeMembers),
      String(paid.length),
      String(Math.max(activeMembers - paid.length, 0)),
      String(total),
    ]);
  }

  const csv = rows.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="laporan-kas-${year}.csv"`,
    },
  });
}
