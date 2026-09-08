import { prisma } from "@/lib/prisma";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(
    date
  );
}

const MODULE_LABELS: Record<string, string> = {
  member: "Data Anggota",
  activity: "Kegiatan",
  attendance: "Kehadiran",
  cash_payment: "Kas Anggota",
  transaction: "Kas Organisasi",
  position: "Kepengurusan",
  period: "Periode",
  user: "User & Izin",
};

export default async function AuditLogPage() {
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 300,
    include: { user: { select: { name: true } } },
  });

  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-900">Audit Log</h2>
      <p className="mt-1 text-sm text-slate-500">
        Riwayat aktivitas sensitif (kas, data anggota, user &amp; izin, kepengurusan, periode).
      </p>

      {logs.length === 0 ? (
        <p className="mt-6 text-sm text-slate-500">Belum ada aktivitas tercatat.</p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2 text-left font-semibold text-slate-600">Waktu</th>
                <th className="px-4 py-2 text-left font-semibold text-slate-600">User</th>
                <th className="px-4 py-2 text-left font-semibold text-slate-600">Modul</th>
                <th className="px-4 py-2 text-left font-semibold text-slate-600">Deskripsi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="whitespace-nowrap px-4 py-2 text-slate-500">
                    {formatDate(log.createdAt)}
                  </td>
                  <td className="px-4 py-2 text-slate-700">{log.user?.name ?? "Sistem"}</td>
                  <td className="px-4 py-2 text-slate-600">
                    {MODULE_LABELS[log.module] ?? log.module}
                  </td>
                  <td className="px-4 py-2 text-slate-700">{log.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
