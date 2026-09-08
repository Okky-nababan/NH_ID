import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { ATTENDANCE_STATUS_LABELS, ATTENDANCE_STATUS_CLASS } from "@/lib/labels";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(date);
}

export default async function KehadiranPage() {
  const session = await auth();
  if (!hasPermission(session, "MANAGE_ATTENDANCE")) redirect("/dashboard");

  const [attendances, activities] = await Promise.all([
    prisma.attendance.findMany({
      include: {
        user: { select: { id: true, name: true } },
        activity: { select: { id: true, name: true, date: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.activity.findMany({
      orderBy: { date: "desc" },
      select: { id: true, name: true, date: true },
      take: 30,
    }),
  ]);

  const total = attendances.length;
  const hadirCount = attendances.filter((a) => a.status === "HADIR").length;
  const percentage = total > 0 ? Math.round((hadirCount / total) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Kehadiran</h1>
        <p className="mt-1 text-sm text-slate-500">
          Rekap kehadiran lintas kegiatan. Input kehadiran dilakukan dari halaman detail
          masing-masing kegiatan.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Total Catatan</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{total}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Persentase Hadir</p>
          <p className="mt-2 text-2xl font-bold text-green-600">{percentage}%</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Kegiatan Tercatat</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{activities.length}</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
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
                  Belum ada data kehadiran.
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
  );
}
