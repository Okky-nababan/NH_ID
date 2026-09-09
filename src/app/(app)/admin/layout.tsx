import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";

const adminLinks = [
  { href: "/admin/users", label: "User & Izin" },
  { href: "/admin/password-reset", label: "Lupa Password" },
  { href: "/admin/profile-edit-requests", label: "Edit Biodata" },
  { href: "/admin/pengumuman", label: "Pengumuman" },
  { href: "/admin/audit-log", label: "Audit Log" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Dashboard Admin</h1>
      <nav className="mt-4 flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {adminLinks.map((l) => (
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
