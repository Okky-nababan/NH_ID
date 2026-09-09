import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { ProfileEditRequestTable } from "./profile-edit-request-table";

export default async function AdminProfileEditRequestsPage() {
  const session = await auth();
  if (!hasPermission(session, "MANAGE_MEMBERS")) redirect("/dashboard");

  const requests = await prisma.profileEditRequest.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      user: { select: { id: true, name: true } },
      resolvedBy: { select: { name: true } },
    },
  });

  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-900">Permintaan Edit Biodata</h2>
      <p className="mt-1 text-sm text-slate-500">
        Anggota tidak bisa mengubah biodatanya sendiri (nama, alamat, tanggal lahir, marga
        ibu, dll) -- permintaan perubahan dari halaman Profil Saya mereka muncul di sini.
        Ubah datanya lewat halaman Data Anggota, lalu tandai permintaan ini selesai.
      </p>
      <div className="mt-4">
        <ProfileEditRequestTable
          requests={requests.map((r) => ({
            id: r.id,
            userId: r.user.id,
            userName: r.user.name,
            message: r.message,
            status: r.status,
            createdAt: r.createdAt.toISOString(),
            resolvedByName: r.resolvedBy?.name ?? "",
          }))}
        />
      </div>
    </div>
  );
}
