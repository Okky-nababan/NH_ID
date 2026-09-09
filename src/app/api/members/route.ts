import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireUser, requirePermission } from "@/lib/api-auth";
import { hasPermission } from "@/lib/permissions";
import { memberSchema } from "@/lib/validation";
import { logAudit } from "@/lib/audit";
import { appendMemberToKasSheet, fetchAllDuesDetail } from "@/lib/sheet-sync";
import { linkPositionsForNewUser } from "@/lib/position-sync";
import { syncCashPaymentsFromSheet } from "@/lib/cash-payment-sync";

const BASE_SELECT = {
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
} as const;

export async function GET() {
  const { session, error } = await requireUser();
  if (error) return error;

  const members = await prisma.user.findMany({
    orderBy: { name: "asc" },
    select: BASE_SELECT,
  });

  const canSeeAll = hasPermission(session, "MANAGE_MEMBERS");

  // Privasi: anggota biasa tidak boleh melihat telepon/email anggota lain.
  const redacted = members.map((m) => {
    if (canSeeAll || m.id === session!.user.id) return m;
    return { ...m, phone: "-", email: "-", notes: null };
  });

  return NextResponse.json({ members: redacted });
}

export async function POST(request: Request) {
  const { session, error } = await requirePermission(
    "MANAGE_MEMBERS",
    "Anda tidak memiliki izin untuk mengelola data anggota."
  );
  if (error) return error;

  const body = await request.json().catch(() => null);
  const parsed = memberSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Data tidak valid", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const data = parsed.data;

  if (!data.password) {
    return NextResponse.json({ error: "Password wajib diisi untuk anggota baru" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(data.password, 10);

  const member = await prisma.user.create({
    data: {
      name: data.name,
      nickname: data.nickname || null,
      email: data.email,
      phone: data.phone,
      passwordHash,
      gender: data.gender,
      birthPlace: data.birthPlace || null,
      birthDate: data.birthDate ? new Date(data.birthDate) : null,
      address: data.address || null,
      memberNumber: data.memberNumber || null,
      membershipStatus: data.membershipStatus,
      notes: data.notes || null,
      photoUrl: data.photoUrl || null,
      role: "ANGGOTA",
      isActive: true,
    },
  });

  await logAudit({
    userId: session!.user.id,
    action: "CREATE_MEMBER",
    module: "member",
    recordId: member.id,
    description: `Menambahkan anggota baru: ${member.name}`,
    request,
  });

  // Tambahkan baris anggota baru ke tab "KAS <tahun berjalan>" spreadsheet.
  // Gagal secara graceful -- penambahan anggota tetap berhasil walau
  // sinkron ke sheet gagal (mis. API belum dikonfigurasi).
  try {
    const result = await appendMemberToKasSheet(member.name, member.joinedAt);
    if (!result.synced) {
      console.warn(`Gagal sinkron anggota baru "${member.name}" ke spreadsheet: ${result.reason}`);
    }
  } catch (err) {
    console.warn(`Gagal sinkron anggota baru "${member.name}" ke spreadsheet:`, err);
  }

  // Hubungkan otomatis ke jabatan kepengurusan yang namanya cocok tapi
  // belum punya akun terhubung.
  await linkPositionsForNewUser(member.id, member.name);

  // Tarik langsung tagihan/riwayat iuran dari spreadsheet KAS untuk
  // anggota baru ini -- supaya begitu ditambahkan, iuran yang sudah/belum
  // dibayar langsung kelihatan tanpa menunggu sinkron manual/cron
  // berikutnya.
  try {
    const duesDetail = await fetchAllDuesDetail();
    await syncCashPaymentsFromSheet(duesDetail);
  } catch (err) {
    console.warn(`Gagal sinkron iuran untuk anggota baru "${member.name}":`, err);
  }

  return NextResponse.json({ member }, { status: 201 });
}
