import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import {
  ACTIVITY_TYPE_LABELS,
  ACTIVITY_STATUS_LABELS,
  ACTIVITY_STATUS_CLASS,
  ATTENDANCE_STATUS_LABELS,
  ATTENDANCE_STATUS_CLASS,
} from "@/lib/labels";
import { AttendanceForm } from "./attendance-form";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "full", timeStyle: "short" }).format(
    date
  );
}

export default async function ActivityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const canManageActivities = hasPermission(session, "MANAGE_ACTIVITIES");
  const canManageAttendance = hasPermission(session, "MANAGE_ATTENDANCE");

  const activity = await prisma.activity.findUnique({
    where: { id },
    include: {
      personInCharge: { select: { id: true, name: true } },
      createdBy: { select: { name: true } },
      attendances: {
        include: { user: { select: { id: true, name: true, photoUrl: true } } },
        orderBy: { user: { name: "asc" } },
      },
    },
  });
  if (!activity) notFound();

  // Privasi: anggota biasa hanya boleh melihat status kehadirannya sendiri,
  // bukan daftar kehadiran seluruh anggota lain untuk kegiatan ini.
  const visibleAttendances = canManageAttendance
    ? activity.attendances
    : activity.attendances.filter((a) => a.userId === session!.user.id);

  const members = canManageAttendance
    ? await prisma.user.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      })
    : [];

  const existingAttendance: Record<string, "HADIR" | "TIDAK_HADIR" | "IZIN" | "SAKIT"> = {};
  for (const a of activity.attendances) existingAttendance[a.userId] = a.status;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-600">
              {ACTIVITY_TYPE_LABELS[activity.type]}
            </span>
            <h1 className="mt-2 text-xl font-bold text-slate-900">{activity.name}</h1>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span
              className={`rounded px-1.5 py-0.5 text-xs font-medium ${ACTIVITY_STATUS_CLASS[activity.status]}`}
            >
              {ACTIVITY_STATUS_LABELS[activity.status]}
            </span>
            {canManageActivities && (
              <Link
                href={`/kegiatan/${activity.id}/edit`}
                className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Edit
              </Link>
            )}
          </div>
        </div>

        <p className="mt-2 text-sm text-slate-600">{activity.description}</p>

        {activity.photoUrl && (
          <div className="relative mt-4 h-56 w-full overflow-hidden rounded-lg bg-slate-100">
            <Image src={activity.photoUrl} alt={activity.name} fill className="object-cover" />
          </div>
        )}

        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between border-b border-slate-100 pb-2">
            <dt className="text-slate-500">Waktu</dt>
            <dd className="font-medium text-slate-900">{formatDate(activity.date)}</dd>
          </div>
          <div className="flex justify-between border-b border-slate-100 pb-2">
            <dt className="text-slate-500">Lokasi</dt>
            <dd className="font-medium text-slate-900">{activity.location}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Penanggung Jawab</dt>
            <dd className="font-medium text-slate-900">
              {activity.personInCharge?.name ?? "-"}
            </dd>
          </div>
        </dl>
        {activity.notes && (
          <p className="mt-3 rounded-md bg-slate-50 p-3 text-sm text-slate-600">
            {activity.notes}
          </p>
        )}
      </div>

      {canManageAttendance ? (
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-slate-900">Input Kehadiran</h2>
          <p className="mt-1 text-xs text-slate-500">
            Dicatat oleh pengurus, bukan konfirmasi mandiri anggota.
          </p>
          <div className="mt-3">
            <AttendanceForm
              activityId={activity.id}
              members={members}
              existing={existingAttendance}
            />
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-slate-900">Kehadiran Saya</h2>
          <p className="mt-1 text-xs text-slate-500">
            Anda hanya bisa melihat status kehadiran milik sendiri untuk kegiatan ini.
          </p>
          {visibleAttendances.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">Belum ada data kehadiran untuk Anda.</p>
          ) : (
            <div className="mt-3 divide-y divide-slate-100">
              {visibleAttendances.map((a) => (
                <div key={a.id} className="flex items-center justify-between py-2 text-sm">
                  <span className="text-slate-900">{a.user.name}</span>
                  <span
                    className={`rounded px-1.5 py-0.5 text-xs font-medium ${ATTENDANCE_STATUS_CLASS[a.status]}`}
                  >
                    {ATTENDANCE_STATUS_LABELS[a.status]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
