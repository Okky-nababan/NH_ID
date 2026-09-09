import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { hasPermission } from "@/lib/permissions";

/**
 * Arahkan ke sub-halaman admin pertama yang memang bisa diakses user ini --
 * bukan selalu /admin/users, supaya Pengurus yang cuma punya izin
 * VIEW_AUDIT_LOG (mis.) tidak nyasar ke halaman yang langsung menolaknya.
 */
export default async function AdminIndexPage() {
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";

  if (isAdmin || hasPermission(session, "MANAGE_USERS")) redirect("/admin/users");
  if (hasPermission(session, "MANAGE_MEMBERS")) redirect("/admin/profile-edit-requests");
  if (hasPermission(session, "VIEW_AUDIT_LOG")) redirect("/admin/audit-log");
  redirect("/dashboard");
}
