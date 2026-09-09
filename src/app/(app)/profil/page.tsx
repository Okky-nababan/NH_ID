import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Tabs } from "@/components/tabs";
import { MONTH_NAMES_ID } from "@/lib/constants";
import { ATTENDANCE_STATUS_LABELS, CASH_STATUS_LABELS, CASH_STATUS_CLASS } from "@/lib/labels";
import { ProfileInfo } from "./profile-info";
import { ChangePasswordForm } from "./change-password-form";
import { EditRequestForm } from "./edit-request-form";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(date);
}

export default async function ProfilPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [user, payments, attendances, positions, editRequests] = await Promise.all([
    // findUnique (bukan findUniqueOrThrow): sesi JWT bisa saja masih hidup
    // untuk akun yang sudah dihapus/dinonaktifkan admin — redirect ke
    // login dengan mulus, bukan crash ke halaman error.
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.cashPayment.findMany({
      where: { userId },
      orderBy: [{ year: "desc" }, { month: "desc" }],
      take: 24,
    }),
    prisma.attendance.findMany({
      where: { userId },
      include: { activity: { select: { name: true, date: true } } },
      orderBy: { createdAt: "desc" },
      take: 24,
    }),
    prisma.position.findMany({
      where: { userId },
      include: { period: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.profileEditRequest.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  if (!user) redirect("/login");

  const tabs = [
    {
      id: "informasi",
      label: "Informasi",
      content: (
        <div className="space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <ProfileInfo
              name={user.name}
              phone={user.phone}
              address={user.address ?? ""}
              birthPlace={user.birthPlace ?? ""}
              birthDate={user.birthDate}
              motherClan={user.motherClan ?? ""}
              photoUrl={user.photoUrl ?? ""}
            />
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-slate-900">Ganti Password</h2>
            <div className="mt-4">
              <ChangePasswordForm />
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-slate-900">Ajukan Perubahan Biodata</h2>
            <div className="mt-4">
              <EditRequestForm
                pastRequests={editRequests.map((r) => ({
                  id: r.id,
                  message: r.message,
                  status: r.status,
                  createdAt: r.createdAt.toISOString(),
                }))}
              />
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "kas",
      label: "Pembayaran Kas",
      content: (
        <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
          {payments.length === 0 ? (
            <p className="p-4 text-sm text-slate-500">Belum ada riwayat pembayaran.</p>
          ) : (
            payments.map((p) => (
              <div key={p.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <span>
                  {MONTH_NAMES_ID[p.month - 1]} {p.year}
                </span>
                <span
                  className={`rounded px-1.5 py-0.5 text-xs font-medium ${CASH_STATUS_CLASS[p.status]}`}
                >
                  {CASH_STATUS_LABELS[p.status]}
                </span>
              </div>
            ))
          )}
        </div>
      ),
    },
    {
      id: "kehadiran",
      label: "Kehadiran",
      content: (
        <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
          {attendances.length === 0 ? (
            <p className="p-4 text-sm text-slate-500">Belum ada riwayat kehadiran.</p>
          ) : (
            attendances.map((a) => (
              <div key={a.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <div>
                  <p className="font-medium text-slate-900">{a.activity.name}</p>
                  <p className="text-xs text-slate-400">{formatDate(a.activity.date)}</p>
                </div>
                <span className="font-medium text-slate-700">
                  {ATTENDANCE_STATUS_LABELS[a.status]}
                </span>
              </div>
            ))
          )}
        </div>
      ),
    },
    {
      id: "kegiatan",
      label: "Kegiatan/Jabatan",
      content: (
        <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
          {positions.length === 0 ? (
            <p className="p-4 text-sm text-slate-500">Belum pernah menjabat.</p>
          ) : (
            positions.map((p) => (
              <div key={p.id} className="px-4 py-3 text-sm">
                <p className="font-medium text-slate-900">{p.title}</p>
                <p className="text-xs text-slate-400">{p.period.name}</p>
              </div>
            ))
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-2xl font-bold text-slate-900">Profil Saya</h1>
      <p className="mt-1 text-sm text-slate-500">
        Nomor Anggota: {user.memberNumber ?? "-"} · Bergabung sejak {formatDate(user.joinedAt)}
      </p>

      <div className="mt-6">
        <Tabs tabs={tabs} />
      </div>
    </div>
  );
}
