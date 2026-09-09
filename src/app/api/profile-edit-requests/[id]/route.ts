import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";

/**
 * Admin/Pengurus menandai permintaan edit biodata selesai diproses --
 * setelah mereka mengubah datanya secara manual lewat /anggota/[id]/edit.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requirePermission(
    "MANAGE_MEMBERS",
    "Anda tidak memiliki izin untuk mengelola data anggota."
  );
  if (error) return error;

  const { id } = await params;
  const existing = await prisma.profileEditRequest.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Permintaan tidak ditemukan" }, { status: 404 });
  }
  if (existing.status === "DONE") {
    return NextResponse.json({ error: "Permintaan sudah selesai diproses" }, { status: 400 });
  }

  const updated = await prisma.profileEditRequest.update({
    where: { id },
    data: { status: "DONE", resolvedById: session!.user.id, resolvedAt: new Date() },
    include: { user: { select: { name: true } } },
  });

  await logAudit({
    userId: session!.user.id,
    action: "RESOLVE_PROFILE_EDIT_REQUEST",
    module: "member",
    recordId: id,
    description: `Menandai permintaan edit biodata (${updated.user.name}) selesai diproses`,
    request,
  });

  return NextResponse.json({ success: true });
}
