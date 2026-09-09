import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import {
  ACTIVITY_TYPE_LABELS,
  ACTIVITY_STATUS_LABELS,
  ACTIVITY_STATUS_CLASS,
} from "@/lib/labels";
import { RoutineButton } from "./routine-button";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "full", timeStyle: "short" }).format(
    date
  );
}

export default async function KegiatanPage() {
  const session = await auth();
  const canManage = hasPermission(session, "MANAGE_ACTIVITIES");

  const activities = await prisma.activity.findMany({
    orderBy: { date: "desc" },
    include: { personInCharge: { select: { name: true } } },
  });

  const now = new Date();
  const upcoming = activities.filter((a) => a.date >= now).reverse();
  const past = activities.filter((a) => a.date < now);

  const renderCard = (activity: (typeof activities)[number]) => (
    <Link
      key={activity.id}
      href={`/kegiatan/${activity.id}`}
      className="block rounded-lg border border-slate-200 bg-white p-4 hover:border-brand hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-600">
            {ACTIVITY_TYPE_LABELS[activity.type]}
          </span>
          {activity.isRoutine && (
            <span
              className="rounded bg-indigo-50 px-1.5 py-0.5 text-xs font-medium text-indigo-700"
              title="Dibuat otomatis oleh jadwal rutin Selasa/Jumat"
            >
              Rutin
            </span>
          )}
        </div>
        <span
          className={`rounded px-1.5 py-0.5 text-xs font-medium ${ACTIVITY_STATUS_CLASS[activity.status]}`}
        >
          {ACTIVITY_STATUS_LABELS[activity.status]}
        </span>
      </div>
      <h3 className="mt-2 font-semibold text-slate-900">{activity.name}</h3>
      <p className="mt-1 text-sm text-slate-500">{formatDate(activity.date)}</p>
      <p className="text-sm text-slate-500">{activity.location}</p>
      {activity.personInCharge && (
        <p className="mt-1 text-xs text-slate-400">PJ: {activity.personInCharge.name}</p>
      )}
    </Link>
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Kegiatan Naposobulung</h1>
          <p className="mt-1 text-sm text-slate-500">
            Ibadah, persekutuan, dan kegiatan lainnya.
          </p>
        </div>
        {canManage && (
          <div className="flex flex-wrap items-start gap-2">
            <RoutineButton />
            <Link
              href="/kegiatan/baru"
              className="rounded-md bg-brand px-3 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
            >
              + Kegiatan Baru
            </Link>
          </div>
        )}
      </div>

      <section>
        <h2 className="text-base font-semibold text-slate-900">Akan Datang</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {upcoming.length > 0 ? (
            upcoming.map(renderCard)
          ) : (
            <p className="text-sm text-slate-500">Belum ada kegiatan mendatang.</p>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-base font-semibold text-slate-900">Riwayat</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {past.length > 0 ? (
            past.map(renderCard)
          ) : (
            <p className="text-sm text-slate-500">Belum ada riwayat kegiatan.</p>
          )}
        </div>
      </section>
    </div>
  );
}
