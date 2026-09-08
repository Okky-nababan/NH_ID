import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { MONTH_NAMES_ID, MONTHLY_DUES } from "@/lib/constants";
import { ATTENDANCE_STATUS_LABELS } from "@/lib/labels";
import { CashBarChart, GrowthLineChart, AttendanceBarChart } from "./dashboard-charts";

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "full", timeStyle: "short" }).format(
    date
  );
}

function lastNMonths(n: number) {
  const now = new Date();
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (n - 1 - i), 1);
    return { month: d.getMonth() + 1, year: d.getFullYear(), label: MONTH_NAMES_ID[d.getMonth()].slice(0, 3) };
  });
}

export default async function DashboardPage() {
  const session = await auth();
  const isManagement = session!.user.role !== "ANGGOTA";

  if (!isManagement) {
    return <MemberDashboard userId={session!.user.id} name={session!.user.name ?? "Anggota"} />;
  }

  return <ManagementDashboard canViewCash={hasPermission(session, "VIEW_CASH_REPORT")} />;
}

async function MemberDashboard({ userId, name }: { userId: string; name: string }) {
  const now = new Date();

  const [member, activePeriod, duesThisMonth, upcomingActivity, lastPayment, lastAttendance, attendances] =
    await Promise.all([
      prisma.user.findUniqueOrThrow({ where: { id: userId } }),
      prisma.managementPeriod.findFirst({ where: { isActive: true } }),
      prisma.cashPayment.findFirst({
        where: { userId, month: now.getMonth() + 1, year: now.getFullYear() },
      }),
      prisma.activity.findFirst({
        where: { date: { gte: now } },
        orderBy: { date: "asc" },
      }),
      prisma.cashPayment.findFirst({
        where: { userId, status: "LUNAS" },
        orderBy: [{ year: "desc" }, { month: "desc" }],
      }),
      prisma.attendance.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
        include: { activity: { select: { name: true } } },
      }),
      prisma.attendance.findMany({ where: { userId } }),
    ]);

  const hadirCount = attendances.filter((a) => a.status === "HADIR").length;
  const attendancePct = attendances.length > 0 ? Math.round((hadirCount / attendances.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Halo, {name}</h1>
        <p className="mt-1 text-sm text-slate-500">Ringkasan aktivitas Anda.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Status Keanggotaan</p>
          <p className="mt-2 text-xl font-bold text-green-600">
            {member.membershipStatus === "AKTIF" ? "Aktif" : member.membershipStatus}
          </p>
          <p className="text-xs text-slate-400">Periode: {activePeriod?.name ?? "-"}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Kas Bulan Ini</p>
          <p
            className={`mt-2 text-xl font-bold ${
              duesThisMonth?.status === "LUNAS" ? "text-green-600" : "text-red-600"
            }`}
          >
            {duesThisMonth?.status === "LUNAS" ? "Lunas" : "Belum Bayar"}
          </p>
          <p className="text-xs text-slate-400">{formatRupiah(MONTHLY_DUES)} / bulan</p>
          <Link href="/kas-saya" className="mt-1 inline-block text-sm text-brand hover:underline">
            Lihat detail
          </Link>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Kehadiran</p>
          <p className="mt-2 text-xl font-bold text-slate-900">{attendancePct}%</p>
          <p className="text-xs text-slate-400">
            {hadirCount} dari {attendances.length} kegiatan tercatat
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Kegiatan Berikutnya</p>
          {upcomingActivity ? (
            <>
              <p className="mt-2 text-base font-semibold text-slate-900">{upcomingActivity.name}</p>
              <p className="text-xs text-slate-400">{formatDate(upcomingActivity.date)}</p>
            </>
          ) : (
            <p className="mt-2 text-sm text-slate-500">Belum ada jadwal.</p>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-900">Riwayat Terakhir</h2>
        <div className="mt-3 space-y-2 text-sm">
          <p className="text-slate-600">
            Pembayaran terakhir:{" "}
            <span className="font-medium text-slate-900">
              {lastPayment ? `${MONTH_NAMES_ID[lastPayment.month - 1]} ${lastPayment.year}` : "Belum ada"}
            </span>
          </p>
          <p className="text-slate-600">
            Kehadiran terakhir:{" "}
            <span className="font-medium text-slate-900">
              {lastAttendance
                ? `${lastAttendance.activity.name} — ${ATTENDANCE_STATUS_LABELS[lastAttendance.status]}`
                : "Belum ada"}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

async function ManagementDashboard({ canViewCash }: { canViewCash: boolean }) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const months = lastNMonths(6);

  const [
    activeMembers,
    totalMembers,
    maleCount,
    femaleCount,
    activityCountThisMonth,
    activePeriod,
    attendances,
    dues,
  ] = await Promise.all([
    prisma.user.count({ where: { isActive: true } }),
    prisma.user.count(),
    prisma.user.count({ where: { gender: "LAKI_LAKI" } }),
    prisma.user.count({ where: { gender: "PEREMPUAN" } }),
    prisma.activity.count({ where: { date: { gte: monthStart, lt: monthEnd } } }),
    prisma.managementPeriod.findFirst({ where: { isActive: true } }),
    prisma.attendance.findMany({ select: { status: true, createdAt: true } }),
    prisma.cashPayment.findMany({
      where: { year: { in: [...new Set(months.map((m) => m.year))] } },
    }),
  ]);

  const duesThisMonth = dues.filter(
    (d) => d.month === now.getMonth() + 1 && d.year === now.getFullYear()
  );
  const paidThisMonth = duesThisMonth.filter((d) => d.status === "LUNAS");
  const totalCashThisMonth = paidThisMonth.reduce((sum, d) => sum + d.amount, 0);

  const cashChartData = months.map((m) => {
    const total = dues
      .filter((d) => d.month === m.month && d.year === m.year && d.status === "LUNAS")
      .reduce((sum, d) => sum + d.amount, 0);
    return { label: `${m.label} ${m.year}`, value: total };
  });

  const attendanceChartData = months.map((m) => {
    const monthAttendances = attendances.filter(
      (a) => a.createdAt.getMonth() + 1 === m.month && a.createdAt.getFullYear() === m.year
    );
    const hadir = monthAttendances.filter((a) => a.status === "HADIR").length;
    const pct = monthAttendances.length > 0 ? Math.round((hadir / monthAttendances.length) * 100) : 0;
    return { label: m.label, value: pct };
  });

  const growthByMonth = await Promise.all(
    months.map(async (m) => {
      const cutoff = new Date(m.year, m.month, 1);
      const count = await prisma.user.count({ where: { joinedAt: { lt: cutoff } } });
      return { label: m.label, value: count };
    })
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">
          Periode aktif: {activePeriod?.name ?? "Belum ada periode aktif"}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Anggota Aktif" value={String(activeMembers)} href="/anggota" />
        <StatCard label="Total Anggota" value={String(totalMembers)} />
        <StatCard label="Anggota Laki-laki" value={String(maleCount)} />
        <StatCard label="Anggota Perempuan" value={String(femaleCount)} />
        {canViewCash && (
          <StatCard label="Total Kas Bulan Ini" value={formatRupiah(totalCashThisMonth)} href="/kas" />
        )}
        {canViewCash && (
          <StatCard
            label="Sudah / Belum Bayar"
            value={`${paidThisMonth.length} / ${Math.max(activeMembers - paidThisMonth.length, 0)}`}
            href="/kas"
          />
        )}
        <StatCard label="Kegiatan Bulan Ini" value={String(activityCountThisMonth)} href="/kegiatan" />
        <StatCard
          label="Persentase Kehadiran"
          value={`${attendanceChartData.at(-1)?.value ?? 0}%`}
          href="/kehadiran"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {canViewCash && (
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-slate-900">Pembayaran Kas per Bulan</h2>
            <div className="mt-2">
              <CashBarChart data={cashChartData} />
            </div>
          </div>
        )}
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-900">Persentase Kehadiran</h2>
          <div className="mt-2">
            <AttendanceBarChart data={attendanceChartData} />
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold text-slate-900">Pertumbuhan Anggota</h2>
          <div className="mt-2">
            <GrowthLineChart data={growthByMonth} />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, href }: { label: string; value: string; href?: string }) {
  const content = (
    <div className="rounded-lg border border-slate-200 bg-white p-5 h-full">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-bold text-slate-900">{value}</p>
    </div>
  );
  if (!href) return content;
  return (
    <Link href={href} className="block hover:border-brand">
      {content}
    </Link>
  );
}
