import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { UserTable } from "./user-table";

export default async function AdminUsersPage() {
  const session = await auth();
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
      permissions: { select: { permission: true } },
    },
  });

  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-900">Manajemen User &amp; Izin</h2>
      <p className="mt-1 text-sm text-slate-500">
        Ubah role atau berikan izin granular ke pengurus tertentu (mis. akses
        kelola pembayaran kas hanya untuk Bendahara). Tidak ada admin/pengurus
        yang permanen — role sendiri pun boleh diturunkan, asal masih ada
        minimal 1 admin aktif lain (supaya jabatan bisa diserahterimakan
        tanpa mengunci akses siapa pun).
      </p>
      <div className="mt-4">
        <UserTable
          users={users.map((u) => ({
            ...u,
            permissions: u.permissions.map((p) => p.permission),
          }))}
          currentUserId={session!.user.id}
        />
      </div>
    </div>
  );
}
