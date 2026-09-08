import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/api-auth";
import { adminPasswordResetSchema } from "@/lib/validation";
import { logAudit } from "@/lib/audit";

/**
 * Admin memproses satu permintaan reset password:
 * - action "reset": set password baru untuk user yang emailnya cocok, lalu
 *   tandai permintaan selesai.
 * - action "dismiss": tandai selesai tanpa mengubah password apa pun
 *   (mis. permintaan spam atau sudah ditangani lewat jalur lain).
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requirePermission(
    "MANAGE_USERS",
    "Anda tidak memiliki izin untuk mengelola permintaan reset password."
  );
  if (error) return error;

  const { id } = await params;
  const resetRequest = await prisma.passwordResetRequest.findUnique({ where: { id } });
  if (!resetRequest) {
    return NextResponse.json({ error: "Permintaan tidak ditemukan" }, { status: 404 });
  }
  if (resetRequest.status === "DONE") {
    return NextResponse.json({ error: "Permintaan sudah selesai diproses" }, { status: 400 });
  }

  const body = await request.json().catch(() => null);

  if (body?.action === "dismiss") {
    await prisma.passwordResetRequest.update({
      where: { id },
      data: { status: "DONE", resolvedById: session!.user.id, resolvedAt: new Date() },
    });
    await logAudit({
      userId: session!.user.id,
      action: "DISMISS_PASSWORD_RESET",
      module: "user",
      recordId: id,
      description: `Menandai permintaan reset password (${resetRequest.email}) selesai tanpa reset`,
      request,
    });
    return NextResponse.json({ success: true });
  }

  const parsed = adminPasswordResetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Data tidak valid", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const targetUser = await prisma.user.findUnique({ where: { email: resetRequest.email } });
  if (!targetUser) {
    return NextResponse.json(
      { error: `Tidak ada akun terdaftar dengan email ${resetRequest.email}` },
      { status: 404 }
    );
  }

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 10);

  await prisma.$transaction([
    prisma.user.update({ where: { id: targetUser.id }, data: { passwordHash } }),
    prisma.passwordResetRequest.update({
      where: { id },
      data: { status: "DONE", resolvedById: session!.user.id, resolvedAt: new Date() },
    }),
  ]);

  await logAudit({
    userId: session!.user.id,
    action: "RESET_USER_PASSWORD",
    module: "user",
    recordId: targetUser.id,
    description: `Mereset password untuk ${targetUser.name} (${targetUser.email}) atas permintaan lupa password`,
    request,
  });

  return NextResponse.json({ success: true });
}
