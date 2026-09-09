import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { MONTH_NAMES_ID } from "@/lib/constants";
import { QueryParamSelect } from "@/components/query-param-select";
import { PrintButton } from "./print-button";
import { SyncButton } from "../kas/sync-button";

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
  // Laporan Kas sengaja terbuka untuk SEMUA anggota yang login (transparansi
  // keuangan organisasi) -- tidak lagi di-gate izin VIEW_CASH_REPORT. Aksi
  // kelola (tombol sinkron spreadsheet) tetap di-gate `canManage` di bawah.
  const session = await auth();
  const canManage = hasPermission(session, "MANAGE_CASH_PAYMENT");

  const { year: yearParam } = await searchParams;
  const year = Number(yearParam) || new Date().getFullYear();
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year + 1, 0, 1);

  const [yearTx, saldoAwalAgg, treasury, duesSummary] = await Promise.all([
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
    prisma.treasurySummary.findUnique({ where: { id: "main" } }),
    // Iuran bulanan per anggota — disinkron dari tab "KAS <tahun>" spreadsheet
    // (lihat /api/kas/sync), BUKAN dari fitur "Catat Pembayaran Kas" di web.
    prisma.duesMonthlySummary.findMany({ where: { year }, orderBy: { month: "asc" } }),
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

  // Rincian per kategori — hanya kebutuhan (pengeluaran) yang sudah
  // digunakan per kategori kegiatan. Pemasukan sengaja tidak ditampilkan di
  // sini (bukan "kebutuhan"), dan kategori tanpa pengeluaran tidak dilist.
  const categoryTotals = new Map<string, { keluar: number; keluarCount: number }>();
  for (const t of yearTx) {
    if (t.type !== "KELUAR") continue;
    const entry = categoryTotals.get(t.category) ?? { keluar: 0, keluarCount: 0 };
    entry.keluar += t.amount;
    entry.keluarCount += 1;
    categoryTotals.set(t.category, entry);
  }
  const categoryRows = Array.from(categoryTotals.entries())
    .map(([category, v]) => ({ category, ...v }))
    .sort((a, b) => b.keluar - a.keluar);
  const maxCategoryExpense = Math.max(1, ...categoryRows.map((c) => c.keluar));

  // Iuran bulanan: total terkumpul & jumlah yang sudah bayar per bulan,
  // dari hasil sinkron tab "KAS <tahun>" spreadsheet.
  const memberCountInSheet = duesSummary[0]?.memberCount ?? 0;
  const duesRows = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const row = duesSummary.find((d) => d.month === month);
    return {
      month,
      label: MONTH_NAMES_ID[i],
      paidCount: row?.paidCount ?? 0,
      unpaidCount: Math.max(memberCountInSheet - (row?.paidCount ?? 0), 0),
      total: row?.totalAmount ?? 0,
    };
  });
  const totalDuesYear = duesRows.reduce((sum, r) => sum + r.total, 0);
  const anyDuesTracked = duesSummary.length > 0;

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Laporan Uang Kas</h1>
          <p className="mt-1 text-sm text-slate-500">Rekapitulasi keuangan tahun {year}.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canManage && <SyncButton />}
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

      {/* Saldo resmi versi Bendahara (dari tab "Total Keuangan" spreadsheet) —
          ditampilkan apa adanya, TIDAK dipaksa sama dengan hasil hitung
          ledger rinci di bawah. Kalau beda, kemungkinan besar karena
          transaksi bulan-bulan terbaru belum sempat ditulis rinci di sheet
          "Rekapitulasi <tahun>" (wajar untuk pembukuan yang masih berjalan). */}
      {treasury && (
        <div className="rounded-lg border-2 border-brand bg-blue-50 p-5 print:hidden">
          <p className="text-sm font-medium text-brand-darker">
            Saldo Kas Saat Ini <span className="font-normal">(versi Bendahara, per {treasury.asOfLabel})</span>
          </p>
          <p className="mt-1 text-2xl font-bold text-brand-darker">
            {formatRupiah(treasury.saldoResmi)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Cum HKBP Immanuel: {formatRupiah(treasury.cumAmount)} &middot; Dipegang Bendahara:{" "}
            {formatRupiah(treasury.bendaharaAmount)}
          </p>
        </div>
      )}

      {/* Saldo Awal & Saldo Akhir saja -- kartu Total Pemasukan/Pengeluaran
          dihapus atas permintaan karena angkanya belum selaras dengan
          laporan resmi di spreadsheet. */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Saldo Awal {year}</p>
          <p className="mt-2 text-xl font-bold text-slate-900">{formatRupiah(saldoAwal)}</p>
        </div>
        <div className="rounded-lg border-2 border-slate-300 bg-slate-50 p-5">
          <p className="text-sm font-medium text-slate-600">Saldo Akhir {year} (rincian tercatat)</p>
          <p className="mt-2 text-xl font-bold text-slate-900">{formatRupiah(saldoAkhir)}</p>
        </div>
      </div>

      {/* Rincian per kategori: kebutuhan (pengeluaran) yang sudah digunakan
          per kategori kegiatan tahun ini. */}
      <section>
        <h2 className="text-base font-semibold text-slate-900">Rincian per Kategori</h2>
        <p className="mt-1 text-sm text-slate-500">
          Kebutuhan yang sudah digunakan per kategori kegiatan, diurutkan dari yang paling besar.
        </p>
        {categoryRows.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">Belum ada pengeluaran tahun ini.</p>
        ) : (
          <div className="mt-4 space-y-3 rounded-lg border border-slate-200 bg-white p-5">
            {categoryRows.map((c) => (
              <div key={c.category}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-800">
                    {c.category} <span className="text-xs text-slate-400">({c.keluarCount} transaksi)</span>
                  </span>
                  <span className="font-medium text-slate-700">{formatRupiah(c.keluar)}</span>
                </div>
                <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${CATEGORY_COLORS[c.category] ?? "bg-slate-400"}`}
                    style={{ width: `${(c.keluar / maxCategoryExpense) * 100}%` }}
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
            ? `Total iuran dan jumlah yang sudah bayar per bulan, disinkron dari sheet "KAS ${year}" spreadsheet Bendahara.`
            : `Belum ada data sinkron untuk tahun ${year} — klik "Sinkronkan dari Spreadsheet" untuk menariknya dari sheet "KAS ${year}".`}
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
                  <td className="px-4 py-2 text-right text-slate-600">{memberCountInSheet}</td>
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
