import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireUser, requirePermission } from "@/lib/api-auth";
import { hasPermission } from "@/lib/permissions";
import { memberSchema } from "@/lib/validation";
import { logAudit } from "@/lib/audit";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireUser();
  if (error) return error;

  const { id } = await params;
  const member = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      memberNumber: true,
      name: true,
      nickname: true,
      gender: true,
      birthPlace: true,
      birthDate: true,
      phone: true,
      email: true,
      address: true,
      membershipStatus: true,
      joinedAt: true,
      photoUrl: true,
      isActive: true,
      role: true,
      notes: true,
    },
  });

  if (!member) {
    return NextResponse.json({ error: "Anggota tidak ditemukan" }, { status: 404 });
  }

  const canSeeAll = hasPermission(session, "MANAGE_MEMBERS");
  if (!canSeeAll && member.id !== session!.user.id) {
    return NextResponse.json({
      member: { ...member, phone: "-", email: "-", notes: null },
    });
  }

  return NextResponse.json({ member });
}

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
  const body = await request.json().catch(() => null);
  const parsed = memberSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Data tidak valid", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const data = parsed.data;

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) {
    return NextResponse.json({ error: "Anggota tidak ditemukan" }, { status: 404 });
  }

  if (data.email !== target.email) {
    const emailTaken = await prisma.user.findUnique({ where: { email: data.email } });
    if (emailTaken) {
      return NextResponse.json({ error: "Email sudah dipakai anggota lain" }, { status: 409 });
    }
  }

  const member = await prisma.user.update({
    where: { id },
    data: {
      name: data.name,
      nickname: data.nickname || null,
      email: data.email,
      phone: data.phone,
      gender: data.gender,
      birthPlace: data.birthPlace || null,
      birthDate: data.birthDate ? new Date(data.birthDate) : null,
      address: data.address || null,
      memberNumber: data.memberNumber || null,
      membershipStatus: data.membershipStatus,
      notes: data.notes || null,
      photoUrl: data.photoUrl || null,
      ...(data.password ? { passwordHash: await bcrypt.hash(data.password, 10) } : {}),
    },
  });

  await logAudit({
    userId: session!.user.id,
    action: "UPDATE_MEMBER",
    module: "member",
    recordId: member.id,
    description: `Mengubah data anggota: ${member.name}`,
    request,
  });

  return NextResponse.json({ member });
}

/** "Hapus" = nonaktifkan (soft), bukan hard delete — menjaga integritas riwayat kas/kehadiran. */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requirePermission(
    "MANAGE_MEMBERS",
    "Anda tidak memiliki izin untuk mengelola data anggota."
  );
  if (error) return error;

  const { id } = await params;
  if (id === session!.user.id) {
    return NextResponse.json({ error: "Tidak bisa menonaktifkan akun sendiri" }, { status: 400 });
  }

  const member = await prisma.user.update({
    where: { id },
    data: { isActive: false, membershipStatus: "TIDAK_AKTIF" },
  });

  await logAudit({
    userId: session!.user.id,
    action: "DEACTIVATE_MEMBER",
    module: "member",
    recordId: member.id,
    description: `Menonaktifkan anggota: ${member.name}`,
    request,
  });

  return NextResponse.json({ success: true });
}
