import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validation";
import { appendMemberToKasSheet, fetchAllDuesDetail } from "@/lib/sheet-sync";
import { linkPositionsForNewUser } from "@/lib/position-sync";
import { syncCashPaymentsFromSheet } from "@/lib/cash-payment-sync";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Data tidak valid", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { name, email, phone, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      phone,
      passwordHash,
      role: "ANGGOTA",
      isActive: true,
    },
  });

  // Tambahkan baris anggota baru ke tab "KAS <tahun berjalan>" spreadsheet.
  // Gagal secara graceful (tidak melempar error) -- pendaftaran tetap
  // berhasil walau sinkron ke sheet gagal (mis. API belum dikonfigurasi).
  try {
    const result = await appendMemberToKasSheet(name, user.joinedAt);
    if (!result.synced) {
      console.warn(`Gagal sinkron anggota baru "${name}" ke spreadsheet: ${result.reason}`);
    }
  } catch (err) {
    console.warn(`Gagal sinkron anggota baru "${name}" ke spreadsheet:`, err);
  }

  // Hubungkan otomatis ke jabatan kepengurusan yang namanya cocok tapi
  // belum punya akun terhubung.
  await linkPositionsForNewUser(user.id, name);

  // Tarik langsung tagihan/riwayat iuran dari spreadsheet KAS untuk
  // anggota baru ini -- supaya begitu daftar, iuran yang sudah/belum
  // dibayar langsung kelihatan tanpa menunggu sinkron manual/cron
  // berikutnya. Pakai fungsi sinkron penuh yang sama (aman dari nama
  // ambigu) supaya konsisten dengan tombol "Sinkronkan dari Spreadsheet".
  try {
    const duesDetail = await fetchAllDuesDetail();
    await syncCashPaymentsFromSheet(duesDetail);
  } catch (err) {
    console.warn(`Gagal sinkron iuran untuk anggota baru "${name}":`, err);
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
