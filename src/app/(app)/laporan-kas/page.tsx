import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { MONTH_NAMES_ID } from "@/lib/constants";
import { PrintButton } from "./print-button";

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default async function LaporanKasPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const session = await auth();
  if (!hasPermission(session, "VIEW_CASH_REPORT")) redirect("/kas-saya");

  const { year: yearParam } = await searchParams;
  const year = Number(yearParam) || new Date().getFullYear();

  const [activeMembers, payments, incomeTx, expenseTx] = await Promise.all([
    prisma.user.count({ where: { isActive: true } }),
    prisma.cashPayment.findMany({ where: { year } }),
    prisma.transaction.aggregate({
      where: { type: "MASUK", date: { gte: new Date(year, 0, 1), lt: new Date(year + 1, 0, 1) } },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { type: "KELUAR", date: { gte: new Date(year, 0, 1), lt: new Date(year + 1, 0, 1) } },
      _sum: { amount: true },
    }),
  ]);

  const monthlyRows = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const monthPayments = payments.filter((p) => p.month === month);
    const paid = monthPayments.filter((p) => p.status === "LUNAS");
    const total = paid.reduce((sum, p) => sum + p.amount, 0);
    return {
      month,
      label: MONTH_NAMES_ID[i],
      totalMembers: activeMembers,
      paidCount: paid.length,
      unpaidCount: Math.max(activeMembers - paid.length, 0),
      total,
    };
  });

  const totalDuesYear = monthlyRows.reduce((sum, r) => sum + r.total, 0);
  const totalIncome = incomeTx._sum.amount ?? 0;
  const totalExpense = expenseTx._sum.amount ?? 0;

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Laporan Uang Kas</h1>
          <p className="mt-1 text-sm text-slate-500">Ringkasan iuran bulanan tahun {year}.</p>
        </div>
        <div className="flex items-center gap-2">
          <form>
            <select
              name="year"
              defaultValue={year}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              onChange={(e) => {
                (e.currentTarget.form as HTMLFormElement).submit();
              }}
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </form>
          <a
            href={`/api/reports/cash/export?year=${year}`}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Export CSV
          </a>
          <PrintButton />
        </div>
      </div>

      <div className="hidden text-center print:block">
        <h1 className="text-xl font-bold">Laporan Uang Kas Naposobulung HKBP Immanuel Dumai</h1>
        <p className="text-sm">Tahun {year}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Total Pemasukan (Ledger)</p>
          <p className="mt-2 text-xl font-bold text-green-600">{formatRupiah(totalIncome)}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Total Pengeluaran (Ledger)</p>
          <p className="mt-2 text-xl font-bold text-red-600">{formatRupiah(totalExpense)}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Total Iuran Terkumpul</p>
          <p className="mt-2 text-xl font-bold text-slate-900">{formatRupiah(totalDuesYear)}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Anggota Aktif</p>
          <p className="mt-2 text-xl font-bold text-slate-900">{activeMembers}</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-slate-600">Bulan</th>
              <th className="px-4 py-2 text-right font-semibold text-slate-600">Jumlah Anggota</th>
              <th className="px-4 py-2 text-right font-semibold text-slate-600">Sudah Bayar</th>
              <th className="px-4 py-2 text-right font-semibold text-slate-600">Belum Bayar</th>
              <th className="px-4 py-2 text-right font-semibold text-slate-600">Total Kas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {monthlyRows.map((r) => (
              <tr key={r.month}>
                <td className="px-4 py-2 text-slate-900">{r.label}</td>
                <td className="px-4 py-2 text-right text-slate-600">{r.totalMembers}</td>
                <td className="px-4 py-2 text-right text-green-600">{r.paidCount}</td>
                <td className="px-4 py-2 text-right text-red-600">{r.unpaidCount}</td>
                <td className="px-4 py-2 text-right font-medium text-slate-900">
                  {formatRupiah(r.total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
