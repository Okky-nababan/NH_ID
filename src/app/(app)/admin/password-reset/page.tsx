import { prisma } from "@/lib/prisma";
import { PasswordResetTable } from "./password-reset-table";

export default async function AdminPasswordResetPage() {
  const requests = await prisma.passwordResetRequest.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { resolvedBy: { select: { name: true } } },
  });

  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-900">Permintaan Lupa Password</h2>
      <p className="mt-1 text-sm text-slate-500">
        Daftar permintaan reset password dari halaman publik &quot;Lupa Password&quot;.
        Tidak ada pengiriman email otomatis — set password baru untuk user yang
        emailnya cocok, lalu sampaikan password barunya langsung ke yang bersangkutan.
      </p>
      <div className="mt-4">
        <PasswordResetTable
          requests={requests.map((r) => ({
            id: r.id,
            email: r.email,
            message: r.message ?? "",
            status: r.status,
            createdAt: r.createdAt.toISOString(),
            resolvedByName: r.resolvedBy?.name ?? "",
          }))}
        />
      </div>
    </div>
  );
}
