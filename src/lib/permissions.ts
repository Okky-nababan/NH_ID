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
