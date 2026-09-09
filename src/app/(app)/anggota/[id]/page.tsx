import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { Tabs } from "@/components/tabs";
import { MONTH_NAMES_ID } from "@/lib/constants";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(date);
}

const STATUS_LABEL: Record<string, string> = {
  AKTIF: "Aktif",
  TIDAK_AKTIF: "Tidak Aktif",
  PINDAH: "Pindah",
  MENGUNDURKAN_DIRI: "Mengundurkan Diri",
};

const GENDER_LABEL: Record<string, string> = {
  LAKI_LAKI: "Laki-laki",
  PEREMPUAN: "Perempuan",
};

const ATTENDANCE_LABEL: Record<string, string> = {
  HADIR: "Hadir",
  TIDAK_HADIR: "Tidak Hadir",
  IZIN: "Izin",
  SAKIT: "Sakit",
};

export default async function AnggotaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const isSelf = session!.user.id === id;
  const canManage = hasPermission(session, "MANAGE_MEMBERS");
  const canSeeFull = isSelf || canManage;

  const member = await prisma.user.findUnique({ where: { id } });
  if (!member) notFound();

  const tabs = [
    {
      id: "informasi",
      label: "Informasi",
      content: (
        <dl className="space-y-3 text-sm">
          {canSeeFull && (
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <dt className="text-slate-500">Email</dt>
              <dd className="font-medium text-slate-900">{member.email}</dd>
            </div>
          )}
          {canSeeFull && (
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <dt className="text-slate-500">Nomor HP</dt>
              <dd className="font-medium text-slate-900">{member.phone}</dd>
            </div>
          )}
          {member.gender && (
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <dt className="text-slate-500">Jenis Kelamin</dt>
              <dd className="font-medium text-slate-900">{GENDER_LABEL[member.gender]}</dd>
            </div>
          )}
          {(member.birthPlace || member.birthDate) && (
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <dt className="text-slate-500">Tempat, Tanggal Lahir</dt>
              <dd className="font-medium text-slate-900">
                {member.birthPlace ?? "-"}
                {member.birthDate ? `, ${formatDate(member.birthDate)}` : ""}
              </dd>
            </div>
          )}
          {member.motherClan && (
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <dt className="text-slate-500">Tubu/Boru ni Mama</dt>
              <dd className="font-medium text-slate-900">{member.motherClan}</dd>
            </div>
          )}
          {canSeeFull && member.address && (
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <dt className="text-slate-500">Alamat</dt>
              <dd className="font-medium text-slate-900">{member.address}</dd>
            </div>
          )}
          <div className="flex justify-between border-b border-slate-100 pb-2">
            <dt className="text-slate-500">Status Keanggotaan</dt>
            <dd className="font-medium text-slate-900">
              {STATUS_LABEL[member.membershipStatus]}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Bergabung Sejak</dt>
            <dd className="font-medium text-slate-900">{formatDate(member.joinedAt)}</dd>
          </div>
        </dl>
      ),
    },
  ];

  if (canSeeFull) {
    const [payments, attendances, positions] = await Promise.all([
      prisma.cashPayment.findMany({
        where: { userId: id },
        orderBy: [{ year: "desc" }, { month: "desc" }],
        take: 24,
      }),
      prisma.attendance.findMany({
        where: { userId: id },
        include: { activity: { select: { name: true, date: true } } },
        orderBy: { createdAt: "desc" },
        take: 24,
      }),
      prisma.position.findMany({
        where: { userId: id },
        include: { period: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    tabs.push({
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
                  className={
                    p.status === "LUNAS"
                      ? "font-medium text-green-600"
                      : "font-medium text-slate-500"
                  }
                >
                  {p.status === "LUNAS" ? "Lunas" : p.status.replace("_", " ")}
                </span>
              </div>
            ))
          )}
        </div>
      ),
    });

    tabs.push({
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
                <span className="font-medium text-slate-700">{ATTENDANCE_LABEL[a.status]}</span>
              </div>
            ))
          )}
        </div>
      ),
    });

    tabs.push({
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
    });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-4">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-blue-100">
            {member.photoUrl ? (
              <Image src={member.photoUrl} alt={member.name} fill className="object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xl font-semibold text-brand">
                {member.name.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-slate-900">{member.name}</h1>
            <p className="text-sm text-slate-500">{member.memberNumber ?? "-"}</p>
          </div>
          {canManage && (
            <Link
              href={`/anggota/${member.id}/edit`}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Edit
            </Link>
          )}
        </div>
      </div>

      <Tabs tabs={tabs} />
    </div>
  );
}
