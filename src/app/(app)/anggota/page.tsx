import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { MemberList } from "./member-list";

export default async function AnggotaPage() {
  const session = await auth();
  const canManage = hasPermission(session, "MANAGE_MEMBERS");

  const members = await prisma.user.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      memberNumber: true,
      name: true,
      gender: true,
      phone: true,
      email: true,
      membershipStatus: true,
      photoUrl: true,
    },
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Data Anggota</h1>
          <p className="mt-1 text-sm text-slate-500">{members.length} anggota terdaftar.</p>
        </div>
        {canManage && (
          <Link
            href="/anggota/baru"
            className="rounded-md bg-brand px-3 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            + Tambah Anggota
          </Link>
        )}
      </div>

      <div className="mt-6">
        <MemberList
          members={canManage ? members : members.map((m) => ({ ...m, phone: "-", email: "-" }))}
          canManage={canManage}
        />
      </div>
    </div>
  );
}
