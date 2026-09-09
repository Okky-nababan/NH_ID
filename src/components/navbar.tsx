"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Logo } from "@/components/logo";
import { ADMIN_SECTION_PERMISSIONS } from "@/lib/permissions";
import type { Permission, Role } from "@/generated/prisma/client";

type NavLink = { href: string; label: string; permission?: Permission };

// Data Anggota dan Laporan Kas SENGAJA tanpa `permission` -- terbuka untuk
// semua anggota yang login, bukan hanya yang diberi izin granular. Data
// kontak sensitif (telepon/email) di halaman Data Anggota tetap disamarkan
// untuk yang bukan pengelola (lihat src/app/(app)/anggota/page.tsx), dan
// aksi kelola di Laporan Kas/Uang Kas tetap di-gate `canManage` di halaman
// masing-masing. "Uang Kas" (kelola pembayaran) tetap di-gate izin karena
// berisi form tambah/hapus transaksi.
const MANAGE_LINKS: NavLink[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/anggota", label: "Data Anggota" },
  { href: "/kegiatan", label: "Kegiatan" },
  { href: "/kehadiran", label: "Kehadiran", permission: "MANAGE_ATTENDANCE" },
  { href: "/kas", label: "Uang Kas", permission: "VIEW_CASH_REPORT" },
  { href: "/laporan-kas", label: "Laporan Kas" },
  { href: "/kepengurusan", label: "Kepengurusan" },
  { href: "/periode", label: "Periode", permission: "MANAGE_PERIODS" },
  { href: "/koor", label: "Partitur Koor" },
  { href: "/dokumen", label: "Dokumen" },
  { href: "/pengumuman", label: "Pengumuman" },
];

const MEMBER_LINKS: NavLink[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/profil", label: "Profil Saya" },
  { href: "/anggota", label: "Data Anggota" },
  { href: "/kas-saya", label: "Kas Saya" },
  { href: "/kas", label: "Uang Kas", permission: "VIEW_CASH_REPORT" },
  { href: "/laporan-kas", label: "Laporan Kas" },
  { href: "/kegiatan", label: "Kegiatan" },
  { href: "/kepengurusan", label: "Kepengurusan" },
  { href: "/koor", label: "Partitur Koor" },
  { href: "/dokumen", label: "Dokumen" },
  { href: "/pengumuman", label: "Pengumuman" },
];

export function Navbar({
  name,
  role,
  permissions,
}: {
  name: string;
  role: Role;
  permissions: Permission[];
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const canSee = (link: NavLink) =>
    role === "ADMIN" || !link.permission || permissions.includes(link.permission);

  const baseLinks = role === "ANGGOTA" ? MEMBER_LINKS : MANAGE_LINKS;
  const visibleLinks = baseLinks.filter(canSee);
  // "Admin" tampil untuk ADMIN, dan untuk Pengurus yang diberi salah satu
  // izin granular terkait admin (MANAGE_USERS, MANAGE_MEMBERS,
  // VIEW_AUDIT_LOG) -- sebelumnya cuma role ADMIN yang lihat link ini,
  // jadi Pengurus yang sudah diberi izin itu tidak pernah punya jalan
  // masuk ke halamannya sama sekali (lihat admin/layout.tsx & page.tsx
  // masing-masing untuk gate izinnya). "/admin" mengarahkan otomatis ke
  // sub-halaman pertama yang memang bisa diakses user ini.
  const canSeeAdminSection =
    role === "ADMIN" || ADMIN_SECTION_PERMISSIONS.some((p) => permissions.includes(p));
  const allLinks: NavLink[] = canSeeAdminSection
    ? [...visibleLinks, { href: "/admin", label: "Admin" }]
    : visibleLinks;

  return (
    <header className="bg-brand-darker shadow-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Logo size={36} withRing={false} />
          <span className="text-sm font-extrabold uppercase tracking-wide text-white sm:text-base">
            NHKBP Immanuel Dumai
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {allLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-md px-2.5 py-2 text-xs font-semibold transition-colors xl:text-sm ${
                pathname === l.href || pathname.startsWith(l.href + "/")
                  ? "bg-white text-brand-darker"
                  : "text-blue-100 hover:bg-white/10 hover:text-white"
              }`}
            >
              {l.label}
            </Link>
          ))}
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="ml-2 rounded-md bg-white/10 px-2.5 py-2 text-xs font-semibold text-white hover:bg-white/20 xl:text-sm"
          >
            Keluar
          </button>
        </nav>

        <div className="flex items-center gap-2 lg:hidden">
          <span className="text-sm font-medium text-blue-100">{name.split(" ")[0]}</span>
          <button
            aria-label="Menu"
            onClick={() => setOpen((v) => !v)}
            className="rounded-md p-2 text-white hover:bg-white/10"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path
                d="M4 6h16M4 12h16M4 18h16"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <nav className="flex flex-col gap-1 border-t border-white/10 bg-brand-darker px-4 py-3 lg:hidden">
          {allLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className={`rounded-md px-3 py-2 text-sm font-semibold ${
                pathname === l.href
                  ? "bg-white text-brand-darker"
                  : "text-blue-100 hover:bg-white/10 hover:text-white"
              }`}
            >
              {l.label}
            </Link>
          ))}
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="rounded-md bg-white/10 px-3 py-2 text-left text-sm font-semibold text-white hover:bg-white/20"
          >
            Keluar
          </button>
        </nav>
      )}
    </header>
  );
}
