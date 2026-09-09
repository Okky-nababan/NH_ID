import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { hasPermission } from "@/lib/permissions";

/**
 * Setiap sub-halaman /admin/* dulunya dikunci khusus role ADMIN di sini,
 * TIDAK PEDULI izin granular (MANAGE_USERS, VIEW_AUDIT_LOG) yang sudah
 * dicentang admin untuk seorang Pengurus di halaman User & Izin -- jadi
 * izin itu tidak pernah benar-benar berfungsi (Pengurus tetap ditolak).
 * Sekarang gate-nya per sub-halaman, sesuai izin yang memang dipakai
 * endpoint API masing-masing -- lihat `permission` di bawah.
 * Pengumuman TETAP khusus ADMIN (tidak ada izin granular untuk itu,
 * lihat api/posts/route.ts).
 */
const adminLinks = [
  { href: "/admin/users", label: "User & Izin", permission: "MANAGE_USERS" as const },
  { href: "/admin/password-reset", label: "Lupa Password", permission: "MANAGE_USERS" as const },
  {
    href: "/admin/profile-edit-requests",
    label: "Edit Biodata",
    permission: "MANAGE_MEMBERS" as const,
  },
  { href: "/admin/pengumuman", label: "Pengumuman", permission: null },
  { href: "/admin/audit-log", label: "Audit Log", permission: "VIEW_AUDIT_LOG" as const },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";
  const visibleLinks = adminLinks.filter(
    (l) => isAdmin || (l.permission && hasPermission(session, l.permission))
  );

  // Tidak ada satu pun sub-halaman admin yang boleh diakses -> tendang ke
  // dashboard. Kalau ada minimal satu, biarkan masuk -- pengecekan yang
  // lebih spesifik (izin persis untuk halaman yang sedang dibuka) ada di
  // masing-masing page.tsx.
  if (visibleLinks.length === 0) {
    redirect("/dashboard");
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Dashboard Admin</h1>
      <nav className="mt-4 flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {visibleLinks.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="rounded-md px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            {l.label}
          </Link>
        ))}
      </nav>
      <div className="mt-6">{children}</div>
    </div>
  );
}
