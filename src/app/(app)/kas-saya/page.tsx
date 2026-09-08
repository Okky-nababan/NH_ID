import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { MONTH_NAMES_ID, MONTHLY_DUES } from "@/lib/constants";
import { CASH_STATUS_LABELS, CASH_STATUS_CLASS } from "@/lib/labels";

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default async function KasSayaPage() {
  const session = await auth();
  const year = new Date().getFullYear();

  const payments = await prisma.cashPayment.findMany({
    where: { userId: session!.user.id, year },
    orderBy: { month: "desc" },
  });

  const paidByMonth = new Map(payments.map((p) => [p.month, p]));
  const currentMonth = new Date().getMonth() + 1;

  const months = Array.from({ length: currentMonth }, (_, i) => currentMonth - i).map((m) => ({
    month: m,
    label: `${MONTH_NAMES_ID[m - 1]} ${year}`,
    payment: paidByMonth.get(m) ?? null,
  }));

  const lunasCount = months.filter((m) => m.payment?.status === "LUNAS").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Kas Saya</h1>
        <p className="mt-1 text-sm text-slate-500">
          Status iuran bulanan Anda tahun {year}. Pencatatan pembayaran dilakukan oleh Bendahara
          — hubungi pengurus untuk konfirmasi pembayaran.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Bulan Lunas</p>
          <p className="mt-2 text-2xl font-bold text-green-600">
            {lunasCount} / {months.length}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Iuran per Bulan</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{formatRupiah(MONTHLY_DUES)}</p>
        </div>
      </div>

      <div className="divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-200 bg-white">
        {months.map((m) => (
          <div key={m.month} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="font-medium text-slate-900">{m.label}</p>
              {m.payment?.paymentDate && (
                <p className="text-xs text-slate-400">
                  {formatRupiah(m.payment.amount)}
                  {m.payment.method ? ` · ${m.payment.method}` : ""}
                </p>
              )}
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                CASH_STATUS_CLASS[m.payment?.status ?? "BELUM_BAYAR"]
              }`}
            >
              {CASH_STATUS_LABELS[m.payment?.status ?? "BELUM_BAYAR"]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
