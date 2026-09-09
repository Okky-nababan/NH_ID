import type { Permission, Role } from "@/generated/prisma/client";

export type PermissionAwareSession = {
  user: {
    role: Role;
    permissions: Permission[];
  };
};

/**
 * ADMIN selalu punya semua izin. Selain itu, izin ditentukan oleh daftar
 * UserPermission yang di-load ke session saat login (lihat src/auth.ts).
 */
export function hasPermission(
  session: PermissionAwareSession | null | undefined,
  permission: Permission
): boolean {
  if (!session?.user) return false;
  if (session.user.role === "ADMIN") return true;
  return session.user.permissions.includes(permission);
}

/**
 * Izin granular yang membuka akses ke minimal satu sub-halaman /admin/*
 * untuk Pengurus (bukan cuma ADMIN) -- dipakai bareng oleh proxy.ts
 * (gerbang route) dan navbar.tsx (tampil/sembunyikan link "Admin"), supaya
 * keduanya selalu sinkron dengan gate per-halaman yang sebenarnya
 * (admin/layout.tsx & masing-masing page.tsx). Pengumuman sengaja tidak
 * termasuk -- tidak ada izin granular untuknya, khusus ADMIN.
 */
export const ADMIN_SECTION_PERMISSIONS: Permission[] = [
  "MANAGE_USERS",
  "MANAGE_MEMBERS",
  "VIEW_AUDIT_LOG",
];

export const PERMISSION_LABELS: Record<Permission, string> = {
  MANAGE_MEMBERS: "Kelola Data Anggota",
  MANAGE_ACTIVITIES: "Kelola Kegiatan",
  MANAGE_ATTENDANCE: "Kelola Kehadiran",
  MANAGE_CASH_PAYMENT: "Kelola Pembayaran Kas",
  VIEW_CASH_REPORT: "Lihat Laporan Kas",
  MANAGE_POSITIONS: "Kelola Kepengurusan",
  MANAGE_PERIODS: "Kelola Periode Kepengurusan",
  MANAGE_USERS: "Kelola User & Izin",
  VIEW_AUDIT_LOG: "Lihat Audit Log",
  MANAGE_CHOIR: "Kelola Partitur Koor",
};
