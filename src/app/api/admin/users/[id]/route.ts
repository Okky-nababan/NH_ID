import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/api-auth";
import { adminUserUpdateSchema } from "@/lib/validation";
import { logAudit } from "@/lib/audit";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requirePermission(
    "MANAGE_USERS",
    "Anda tidak memiliki izin untuk mengelola user."
  );
  if (error) return error;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = adminUserUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Data tidak valid", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  if (id === session!.user.id && parsed.data.isActive === false) {
    return NextResponse.json(
      { error: "Tidak bisa menonaktifkan akun sendiri" },
      { status: 400 }
    );
  }
  // Tidak ada admin/pengurus yang permanen -- siapa pun (termasuk diri
  // sendiri) boleh turun dari role ADMIN, SELAMA masih ada minimal 1 admin
  // aktif lain yang bisa melanjutkan tugas kelola user/izin. Ini mencegah
  // organisasi terkunci tanpa admin sama sekali, tapi tidak lagi mengunci
  // satu orang jadi admin selamanya.
  if (id === session!.user.id && parsed.data.role && parsed.data.role !== "ADMIN") {
    const otherActiveAdmins = await prisma.user.count({
      where: { role: "ADMIN", isActive: true, id: { not: id } },
    });
    if (otherActiveAdmins === 0) {
      return NextResponse.json(
        {
          error:
            "Tunjuk admin lain terlebih dahulu sebelum menurunkan role Anda sendiri -- organisasi harus selalu punya minimal 1 admin aktif.",
        },
        { status: 400 }
      );
    }
  }

  const { permissions, ...userFields } = parsed.data;

  const user = await prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({ where: { id }, data: userFields });

    if (permissions) {
      await tx.userPermission.deleteMany({ where: { userId: id } });
      if (permissions.length > 0) {
        await tx.userPermission.createMany({
          data: permissions.map((permission) => ({ userId: id, permission })),
        });
      }
    }

    return updated;
  });

  await logAudit({
    userId: session!.user.id,
    action: "UPDATE_USER_ACCESS",
    module: "user",
    recordId: id,
    description: `Mengubah akses user ${user.name}${
      parsed.data.role ? ` — role: ${parsed.data.role}` : ""
    }${permissions ? ` — izin: ${permissions.join(", ") || "(tidak ada)"}` : ""}`,
    request,
  });

  return NextResponse.json({ user });
}
