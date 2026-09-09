import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { ATTENDANCE_STATUS_LABELS, ATTENDANCE_STATUS_CLASS } from "@/lib/labels";
import { MONTH_NAMES_ID } from "@/lib/constants";
import { QueryParamSelect } from "@/components/query-param-select";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(date);
}

/** 6 bulan terakhir (termasuk bulan berjalan), untuk pilihan filter periode. */
function buildPeriodOptions() {
  const now = new Date();
  const options = [{ value: "", label: "Semua Waktu" }];
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    options.push({ value, label: `${MONTH_NAMES_ID[d.getMonth()]} ${d.getFullYear()}` });
  }
  return options;
}

export default async function KehadiranPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const session = await auth();
  if (!hasPermission(session, "MANAGE_ATTENDANCE")) redirect("/dashboard");

  const { period } = await searchParams;
  let periodStart: Date | undefined;
  let periodEnd: Date | undefined;
  let periodLabel = "Semua Waktu";
  if (period && /^\d{4}-\d{2}$/.test(period)) {
    const [y, m] = period.split("-").map(Number);
    periodStart = new Date(y, m - 1, 1);
    periodEnd = new Date(y, m, 1);
    periodLabel = `${MONTH_NAMES_ID[m - 1]} ${y}`;
  }
  const activityDateFilter =
    periodStart && periodEnd ? { date: { gte: periodStart, lt: periodEnd } } : undefined;

  const [members, grouped, attendances, activityCount] = await Promise.all([
    prisma.user.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    // Rekap per anggota: hitung jumlah tiap status kehadiran, dibatasi ke
    // kegiatan dalam periode terpilih (kalau ada filter).
    prisma.attendance.groupBy({
      by: ["userId", "status"],
      where: activityDateFilter ? { activity: activityDateFilter } : undefined,
      _count: { _all: true },
    }),
    prisma.attendance.findMany({
      where: activityDateFilter ? { activity: activityDateFilter } : undefined,
      include: {
        user: { select: { id: true, name: true } },
        activity: { select: { id: true, name: true, date: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.activity.count({ where: activityDateFilter }),
  ]);

  type Tally = { HADIR: number; TIDAK_HADIR: number; IZIN: number; SAKIT: number; total: number };
  const tallyByUser = new Map<string, Tally>();
  for (const row of grouped) {
    const tally = tallyByUser.get(row.userId) ?? {
      HADIR: 0,
      TIDAK_HADIR: 0,
      IZIN: 0,
      SAKIT: 0,
      total: 0,
    };
    tally[row.status] += row._count._all;
    tally.total += row._count._all;
    tallyByUser.set(row.userId, tally);
  }

  const recap = members
    .map((m) => {
      const tally = tallyByUser.get(m.id) ?? { HADIR: 0, TIDAK_HADIR: 0, IZIN: 0, SAKIT: 0, total: 0 };
      const pctHadir = tally.total > 0 ? Math.round((tally.HADIR / tally.total) * 100) : null;
      const pctKeaktifan =
        tally.total > 0 ? Math.round(((tally.HADIR + tally.IZIN) / tally.total) * 100) : null;
      return { id: m.id, name: m.name, tally, pctHadir, pctKeaktifan };
    })
    // Anggota dengan catatan kehadiran naik ke atas, diurutkan dari yang
    // paling aktif -- anggota tanpa catatan sama sekali ditaruh paling bawah.
    .sort((a, b) => {
      if (a.pctKeaktifan === null && b.pctKeaktifan === null) return a.name.localeCompare(b.name);
      if (a.pctKeaktifan === null) return 1;
      if (b.pctKeaktifan === null) return -1;
      return b.pctKeaktifan - a.pctKeaktifan || a.name.localeCompare(b.name);
    });

  const totalRecorded = attendances.length;
  const hadirCount = attendances.filter((a) => a.status === "HADIR").length;
  const overallPct = totalRecorded > 0 ? Math.round((hadirCount / totalRecorded) * 100) : 0;

  const periodOptions = buildPeriodOptions();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Kehadiran</h1>
          <p className="mt-1 text-sm text-slate-500">
            Checklist kehadiran diisi dari halaman detail masing-masing kegiatan. Hanya
            pengurus/admin (izin Kelola Kehadiran) yang bisa mencentang status anggota.
          </p>
        </div>
        <QueryParamSelect
          paramName="period"
          options={periodOptions}
          fallback=""
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Total Catatan &middot; {periodLabel}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{totalRecorded}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Persentase Hadir</p>
          <p className="mt-2 text-2xl font-bold text-green-600">{overallPct}%</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Kegiatan &middot; {periodLabel}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{activityCount}</p>
        </div>
      </div>

      <div>
        <h2 className="text-base font-semibold text-slate-900">Rekap Keaktifan per Anggota</h2>
        <p className="mt-1 text-sm text-slate-500">
          Persentase Hadir dan Keaktifan (Hadir + Izin) dari kegiatan yang sudah dicatat
          kehadirannya pada periode {periodLabel.toLowerCase()}.
        </p>
        <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2 text-left font-semibold text-slate-600">Anggota</th>
                <th className="px-4 py-2 text-right font-semibold text-slate-600">Kegiatan</th>
                <th className="px-4 py-2 text-right font-semibold text-slate-600">Hadir</th>
                <th className="px-4 py-2 text-right font-semibold text-slate-600">Izin</th>
                <th className="px-4 py-2 text-right font-semibold text-slate-600">% Hadir</th>
                <th className="px-4 py-2 text-right font-semibold text-slate-600">Keaktifan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recap.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-2 font-medium text-slate-900">{r.name}</td>
                  <td className="px-4 py-2 text-right tabular-nums text-slate-600">
                    {r.tally.total}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums text-slate-600">
                    {r.tally.HADIR}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums text-slate-600">
                    {r.tally.IZIN}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums text-slate-600">
                    {r.pctHadir === null ? "-" : `${r.pctHadir}%`}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {r.pctKeaktifan === null ? (
                      <span className="text-slate-400">Belum ada data</span>
                    ) : (
                      <span
                        className={`rounded px-1.5 py-0.5 text-xs font-semibold tabular-nums ${
                          r.pctKeaktifan >= 75
                            ? "bg-green-50 text-green-700"
                            : r.pctKeaktifan >= 50
                              ? "bg-amber-50 text-amber-700"
                              : "bg-red-50 text-red-700"
                        }`}
                      >
                        {r.pctKeaktifan}%
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="text-base font-semibold text-slate-900">Riwayat Pencatatan</h2>
        <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2 text-left font-semibold text-slate-600">Anggota</th>
                <th className="px-4 py-2 text-left font-semibold text-slate-600">Kegiatan</th>
                <th className="px-4 py-2 text-left font-semibold text-slate-600">Tanggal</th>
                <th className="px-4 py-2 text-left font-semibold text-slate-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {attendances.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                    Belum ada data kehadiran untuk periode ini.
                  </td>
                </tr>
              ) : (
                attendances.map((a) => (
                  <tr key={a.id}>
                    <td className="px-4 py-2 text-slate-900">{a.user.name}</td>
                    <td className="px-4 py-2 text-slate-600">
                      <Link href={`/kegiatan/${a.activity.id}`} className="hover:underline">
                        {a.activity.name}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-slate-500">{formatDate(a.activity.date)}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`rounded px-1.5 py-0.5 text-xs font-medium ${ATTENDANCE_STATUS_CLASS[a.status]}`}
                      >
                        {ATTENDANCE_STATUS_LABELS[a.status]}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
