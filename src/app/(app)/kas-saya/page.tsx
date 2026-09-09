import { redirect } from "next/navigation";
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

// timeZone eksplisit "UTC" -- tanggal bergabung disimpan sebagai
// Date.UTC(...) (lihat sheet-sync.ts/cash-payment-sync.ts), jadi harus
// dibaca kembali dengan UTC juga supaya tidak mundur/maju sehari
// tergantung zona waktu server yang menjalankan (lokal WIB vs produksi).
function formatDate(date: Date) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "long", timeZone: "UTC" }).format(date);
}

export default async function KasSayaPage() {
  const session = await auth();
  const year = new Date().getFullYear();

  const [user, payments] = await Promise.all([
    prisma.user.findUnique({ where: { id: session!.user.id }, select: { joinedAt: true } }),
    prisma.cashPayment.findMany({ where: { userId: session!.user.id, year } }),
  ]);

  // Sesi bisa jadi basi (mis. akun dihapus lalu dibuat ulang oleh Admin) --
  // lebih baik minta login ulang daripada crash dengan error generik.
  if (!user) redirect("/login");

  const joinedAt = user.joinedAt;
  // getUTCFullYear/getUTCMonth (bukan versi lokal) -- konsisten dengan
  // Date.UTC(...) yang dipakai saat menyimpan tanggal ini.
  const joinYear = joinedAt.getUTCFullYear();
  const joinMonth = joinedAt.getUTCMonth() + 1;

  const paidByMonth = new Map(payments.map((p) => [p.month, p]));

  // Seluruh 12 bulan tahun ini (Januari s/d Desember), BUKAN cuma sampai
  // bulan berjalan -- supaya kelihatan jelas tunggakan sisa tahun juga.
  const months = Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
    const hasJoinedByThisMonth = year > joinYear || (year === joinYear && m >= joinMonth);
    const payment = paidByMonth.get(m) ?? null;
    // Kalau ternyata ADA catatan pembayaran untuk bulan ini (mis. tanggal
    // bergabung di sheet kosong sehingga fallback ke tanggal daftar akun
    // web, padahal riwayat iuran dari sheet sudah ada sejak lebih awal),
    // tetap dianggap "berlaku" -- status pembayaran yang sebenarnya lebih
    // dipercaya daripada tebakan tanggal bergabung.
    const isApplicable = hasJoinedByThisMonth || payment !== null;
    return {
      month: m,
      label: `${MONTH_NAMES_ID[m - 1]} ${year}`,
      payment,
      isApplicable,
    };
  });

  const applicableMonths = months.filter((m) => m.isApplicable);
  const lunasCount = applicableMonths.filter((m) => m.payment?.status === "LUNAS").length;
  const unpaidMonths = applicableMonths.filter((m) => m.payment?.status !== "LUNAS");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Kas Saya</h1>
        <p className="mt-1 text-sm text-slate-500">
          Status iuran bulanan Anda tahun {year}. Pencatatan pembayaran dilakukan oleh Bendahara
          — hubungi pengurus untuk konfirmasi pembayaran.
        </p>
        <p className="mt-1 text-sm text-slate-500">
          Bergabung ke Naposobulung HKBP Immanuel Dumai sejak{" "}
          <span className="font-medium text-slate-700">{formatDate(joinedAt)}</span>.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Bulan Lunas</p>
          <p className="mt-2 text-2xl font-bold text-green-600">
            {lunasCount} / {applicableMonths.length}
          </p>
          {applicableMonths.length < 12 && (
            <p className="mt-1 text-xs text-slate-400">
              Dari {applicableMonths.length} bulan sejak bergabung tahun ini (dari total 12 bulan).
            </p>
          )}
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Iuran per Bulan</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{formatRupiah(MONTHLY_DUES)}</p>
        </div>
      </div>

      {/* Keterangan iuran yang belum dibayar -- ringkas & mudah dibaca
          sebelum masuk ke tabel rinci per bulan di bawah. */}
      {unpaidMonths.length > 0 ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-medium text-amber-800">
            Iuran belum dibayar ({unpaidMonths.length} bulan):
          </p>
          <p className="mt-1 text-sm text-amber-700">
            {unpaidMonths.map((m) => MONTH_NAMES_ID[m.month - 1]).join(", ")} {year} — total{" "}
            {formatRupiah(unpaidMonths.length * MONTHLY_DUES)}.
          </p>
        </div>
      ) : (
        applicableMonths.length > 0 && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <p className="text-sm font-medium text-green-800">
              Semua iuran tahun {year} sudah lunas. Terima kasih! 🎉
            </p>
          </div>
        )
      )}

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
            {m.isApplicable ? (
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  CASH_STATUS_CLASS[m.payment?.status ?? "BELUM_BAYAR"]
                }`}
              >
                {CASH_STATUS_LABELS[m.payment?.status ?? "BELUM_BAYAR"]}
              </span>
            ) : (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                Belum Bergabung
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
