import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { MONTH_NAMES_ID } from "@/lib/constants";
import { QueryParamSelect } from "@/components/query-param-select";
import { PrintButton } from "./print-button";

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

const CATEGORY_COLORS: Record<string, string> = {
  Kas: "bg-blue-500",
  Sosial: "bg-pink-500",
  Koor: "bg-purple-500",
  Rohani: "bg-amber-500",
  Olahraga: "bg-emerald-500",
  Litbang: "bg-cyan-500",
  "Panitia/Acara": "bg-orange-500",
  Lainnya: "bg-slate-400",
};

export default async function LaporanKasPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const session = await auth();
  if (!hasPermission(session, "VIEW_CASH_REPORT")) redirect("/kas-saya");

  const { year: yearParam } = await searchParams;
  const year = Number(yearParam) || new Date().getFullYear();
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year + 1, 0, 1);

  const [activeMembers, payments, yearTx, saldoAwalAgg] = await Promise.all([
    prisma.user.count({ where: { isActive: true } }),
    prisma.cashPayment.findMany({ where: { year } }),
    prisma.transaction.findMany({
      where: { date: { gte: yearStart, lt: yearEnd } },
      orderBy: { date: "asc" },
    }),
    // Saldo awal tahun = akumulasi semua transaksi sebelum 1 Januari tahun ini.
    prisma.transaction.groupBy({
      by: ["type"],
      where: { date: { lt: yearStart } },
      _sum: { amount: true },
    }),
  ]);

  const saldoAwal =
    (saldoAwalAgg.find((a) => a.type === "MASUK")?._sum.amount ?? 0) -
    (saldoAwalAgg.find((a) => a.type === "KELUAR")?._sum.amount ?? 0);

  const totalIncome = yearTx.filter((t) => t.type === "MASUK").reduce((s, t) => s + t.amount, 0);
  const totalExpense = yearTx.filter((t) => t.type === "KELUAR").reduce((s, t) => s + t.amount, 0);
  const saldoAkhir = saldoAwal + totalIncome - totalExpense;

  // Ringkasan per bulan dengan saldo berjalan — supaya kelihatan alurnya,
  // sama seperti yang biasa dicatat manual di pembukuan kas.
  const monthlySummary = Array.from({ length: 12 }, (_, i) => i + 1).reduce<
    { month: number; label: string; masuk: number; keluar: number; saldo: number; count: number }[]
  >((acc, month) => {
    const monthTx = yearTx.filter((t) => t.date.getMonth() + 1 === month);
    const masuk = monthTx.filter((t) => t.type === "MASUK").reduce((s, t) => s + t.amount, 0);
    const keluar = monthTx.filter((t) => t.type === "KELUAR").reduce((s, t) => s + t.amount, 0);
    const previousSaldo = acc.length > 0 ? acc[acc.length - 1].saldo : saldoAwal;
    return [
      ...acc,
      { month, label: MONTH_NAMES_ID[month - 1], masuk, keluar, saldo: previousSaldo + masuk - keluar, count: monthTx.length },
    ];
  }, []);

  // Rincian per kategori — supaya jelas uang paling banyak kepakai untuk apa.
  const categoryTotals = new Map<string, { masuk: number; keluar: number; count: number }>();
  for (const t of yearTx) {
    const entry = categoryTotals.get(t.category) ?? { masuk: 0, keluar: 0, count: 0 };
    if (t.type === "MASUK") entry.masuk += t.amount;
    else entry.keluar += t.amount;
    entry.count += 1;
    categoryTotals.set(t.category, entry);
  }
  const categoryRows = Array.from(categoryTotals.entries())
    .map(([category, v]) => ({ category, ...v, net: v.masuk - v.keluar }))
    .sort((a, b) => b.masuk + b.keluar - (a.masuk + a.keluar));
  const maxCategoryFlow = Math.max(1, ...categoryRows.map((c) => c.masuk + c.keluar));

  const duesRows = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const paid = payments.filter((p) => p.month === month && p.status === "LUNAS");
    return {
      month,
      label: MONTH_NAMES_ID[i],
      paidCount: paid.length,
      unpaidCount: Math.max(activeMembers - paid.length, 0),
      total: paid.reduce((sum, p) => sum + p.amount, 0),
    };
  });
  const totalDuesYear = duesRows.reduce((sum, r) => sum + r.total, 0);
  const anyDuesTracked = payments.length > 0;

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Laporan Uang Kas</h1>
          <p className="mt-1 text-sm text-slate-500">Rekapitulasi keuangan tahun {year}.</p>
        </div>
        <div className="flex items-center gap-2">
          <QueryParamSelect
            paramName="year"
            fallback={String(year)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            options={years.map((y) => ({ value: String(y), label: String(y) }))}
          />
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

      {/* Ringkasan utama: saldo awal -> pemasukan/pengeluaran -> saldo akhir,
          urutan yang sama dengan cara pembukuan manual biasa dibaca. */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Saldo Awal {year}</p>
          <p className="mt-2 text-xl font-bold text-slate-900">{formatRupiah(saldoAwal)}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Total Pemasukan</p>
          <p className="mt-2 text-xl font-bold text-green-600">{formatRupiah(totalIncome)}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Total Pengeluaran</p>
          <p className="mt-2 text-xl font-bold text-red-600">{formatRupiah(totalExpense)}</p>
        </div>
        <div className="rounded-lg border-2 border-brand bg-blue-50 p-5">
          <p className="text-sm font-medium text-brand-darker">Saldo Akhir {year}</p>
          <p className="mt-2 text-xl font-bold text-brand-darker">{formatRupiah(saldoAkhir)}</p>
        </div>
      </div>

      {/* Rincian per kategori: ke mana saja uang kas mengalir tahun ini. */}
      <section>
        <h2 className="text-base font-semibold text-slate-900">Rincian per Kategori</h2>
        <p className="mt-1 text-sm text-slate-500">
          Total arus kas (masuk + keluar) per kategori kegiatan, diurutkan dari yang paling besar.
        </p>
        {categoryRows.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">Belum ada transaksi tahun ini.</p>
        ) : (
          <div className="mt-4 space-y-3 rounded-lg border border-slate-200 bg-white p-5">
            {categoryRows.map((c) => (
              <div key={c.category}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-800">
                    {c.category} <span className="text-xs text-slate-400">({c.count} transaksi)</span>
                  </span>
                  <span className="text-slate-600">
                    <span className="text-green-600">+{formatRupiah(c.masuk)}</span>
                    {" / "}
                    <span className="text-red-600">-{formatRupiah(c.keluar)}</span>
                  </span>
                </div>
                <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${CATEGORY_COLORS[c.category] ?? "bg-slate-400"}`}
                    style={{ width: `${((c.masuk + c.keluar) / maxCategoryFlow) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Ringkasan per bulan dengan saldo berjalan — format yang sama dengan
          catatan pembukuan manual (Saldo Januari, Saldo Februari, dst). */}
      <section>
        <h2 className="text-base font-semibold text-slate-900">Ringkasan Bulanan</h2>
        <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2 text-left font-semibold text-slate-600">Bulan</th>
                <th className="px-4 py-2 text-right font-semibold text-slate-600">Transaksi</th>
                <th className="px-4 py-2 text-right font-semibold text-slate-600">Pemasukan</th>
                <th className="px-4 py-2 text-right font-semibold text-slate-600">Pengeluaran</th>
                <th className="px-4 py-2 text-right font-semibold text-slate-600">Saldo Berjalan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="bg-slate-50/50">
                <td className="px-4 py-2 font-medium text-slate-700" colSpan={4}>
                  Saldo Awal Tahun {year}
                </td>
                <td className="px-4 py-2 text-right font-semibold text-slate-900">
                  {formatRupiah(saldoAwal)}
                </td>
              </tr>
              {monthlySummary.map((r) => (
                <tr key={r.month}>
                  <td className="px-4 py-2 text-slate-900">{r.label}</td>
                  <td className="px-4 py-2 text-right text-slate-500">{r.count}</td>
                  <td className="px-4 py-2 text-right text-green-600">
                    {r.masuk > 0 ? formatRupiah(r.masuk) : "-"}
                  </td>
                  <td className="px-4 py-2 text-right text-red-600">
                    {r.keluar > 0 ? formatRupiah(r.keluar) : "-"}
                  </td>
                  <td className="px-4 py-2 text-right font-medium text-slate-900">
                    {formatRupiah(r.saldo)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Iuran bulanan per anggota — modul terpisah dari ledger di atas. */}
      <section>
        <h2 className="text-base font-semibold text-slate-900">Iuran Bulanan Anggota</h2>
        <p className="mt-1 text-sm text-slate-500">
          {anyDuesTracked
            ? "Status pembayaran iuran bulanan yang dicatat Bendahara lewat halaman Uang Kas."
            : "Belum ada pencatatan iuran bulanan per anggota untuk tahun ini — data di atas berasal dari ledger organisasi (pemasukan/pengeluaran umum), bukan dari fitur ini."}
        </p>
        <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2 text-left font-semibold text-slate-600">Bulan</th>
                <th className="px-4 py-2 text-right font-semibold text-slate-600">Jumlah Anggota</th>
                <th className="px-4 py-2 text-right font-semibold text-slate-600">Sudah Bayar</th>
                <th className="px-4 py-2 text-right font-semibold text-slate-600">Belum Bayar</th>
                <th className="px-4 py-2 text-right font-semibold text-slate-600">Total Iuran</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {duesRows.map((r) => (
                <tr key={r.month}>
                  <td className="px-4 py-2 text-slate-900">{r.label}</td>
                  <td className="px-4 py-2 text-right text-slate-600">{activeMembers}</td>
                  <td className="px-4 py-2 text-right text-green-600">{r.paidCount}</td>
                  <td className="px-4 py-2 text-right text-red-600">{r.unpaidCount}</td>
                  <td className="px-4 py-2 text-right font-medium text-slate-900">
                    {formatRupiah(r.total)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50">
              <tr>
                <td className="px-4 py-2 font-semibold text-slate-700" colSpan={4}>
                  Total Iuran Terkumpul {year}
                </td>
                <td className="px-4 py-2 text-right font-semibold text-slate-900">
                  {formatRupiah(totalDuesYear)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>
    </div>
  );
}
