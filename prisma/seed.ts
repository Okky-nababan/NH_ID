import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL belum diatur. Isi .env dengan connection string PostgreSQL.");
}
const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Menghapus data lama...");
  await prisma.auditLog.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.post.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.cashPayment.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.position.deleteMany();
  await prisma.managementPeriod.deleteMany();
  await prisma.userPermission.deleteMany();
  await prisma.user.deleteMany();

  const adminPasswordHash = await bcrypt.hash("admin123", 10);
  const pengurusPasswordHash = await bcrypt.hash("pengurus123", 10);
  const anggotaPasswordHash = await bcrypt.hash("anggota123", 10);

  const admin = await prisma.user.create({
    data: {
      name: "Admin Sistem",
      email: "admin@nhid.church",
      phone: "081200000001",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
      isActive: true,
      memberNumber: "NHID-0001",
      gender: "LAKI_LAKI",
      membershipStatus: "AKTIF",
      address: "Dumai, Riau",
    },
  });

  const bendahara = await prisma.user.create({
    data: {
      name: "Andi Simanjuntak",
      nickname: "Andi",
      email: "bendahara@nhid.church",
      phone: "081200000002",
      passwordHash: pengurusPasswordHash,
      role: "PENGURUS",
      isActive: true,
      memberNumber: "NHID-0002",
      gender: "LAKI_LAKI",
      membershipStatus: "AKTIF",
      address: "Dumai, Riau",
    },
  });
  await prisma.userPermission.createMany({
    data: [
      { userId: bendahara.id, permission: "MANAGE_CASH_PAYMENT" },
      { userId: bendahara.id, permission: "VIEW_CASH_REPORT" },
    ],
  });

  const sekretaris = await prisma.user.create({
    data: {
      name: "Budi Siregar",
      nickname: "Budi",
      email: "sekretaris@nhid.church",
      phone: "081200000003",
      passwordHash: pengurusPasswordHash,
      role: "PENGURUS",
      isActive: true,
      memberNumber: "NHID-0003",
      gender: "LAKI_LAKI",
      membershipStatus: "AKTIF",
      address: "Dumai, Riau",
    },
  });
  await prisma.userPermission.createMany({
    data: [
      { userId: sekretaris.id, permission: "MANAGE_MEMBERS" },
      { userId: sekretaris.id, permission: "MANAGE_ACTIVITIES" },
      { userId: sekretaris.id, permission: "MANAGE_ATTENDANCE" },
    ],
  });

  const anggotaData = [
    { name: "Daniel Silalahi", email: "daniel@nhid.church", gender: "LAKI_LAKI" as const },
    { name: "Jonathan Hutabarat", email: "jonathan@nhid.church", gender: "LAKI_LAKI" as const },
    { name: "Grace Manurung", email: "grace@nhid.church", gender: "PEREMPUAN" as const },
    { name: "Ruth Sitorus", email: "ruth@nhid.church", gender: "PEREMPUAN" as const },
    { name: "Sarah Simamora", email: "sarah@nhid.church", gender: "PEREMPUAN" as const },
    { name: "David Nababan", email: "david@nhid.church", gender: "LAKI_LAKI" as const },
    { name: "Michael Tampubolon", email: "michael@nhid.church", gender: "LAKI_LAKI" as const },
    { name: "Angel Panggabean", email: "angel@nhid.church", gender: "PEREMPUAN" as const },
  ];

  const anggotaMembers = [];
  for (let i = 0; i < anggotaData.length; i++) {
    const d = anggotaData[i];
    const member = await prisma.user.create({
      data: {
        name: d.name,
        email: d.email,
        phone: `08130000${String(i + 10).padStart(4, "0")}`,
        passwordHash: anggotaPasswordHash,
        role: "ANGGOTA",
        isActive: true,
        memberNumber: `NHID-${String(i + 4).padStart(4, "0")}`,
        gender: d.gender,
        membershipStatus: "AKTIF",
        address: "Dumai, Riau",
        birthPlace: "Dumai",
        birthDate: new Date(2000 + (i % 5), i % 12, (i % 27) + 1),
      },
    });
    anggotaMembers.push(member);
  }

  const allMembers = [admin, bendahara, sekretaris, ...anggotaMembers];

  console.log("Membuat periode kepengurusan...");
  const now = new Date();
  const oldPeriod = await prisma.managementPeriod.create({
    data: {
      name: "Periode 2023-2025",
      startYear: 2023,
      endYear: 2025,
      isActive: false,
    },
  });
  const activePeriod = await prisma.managementPeriod.create({
    data: {
      name: "Periode 2025-2027",
      startYear: 2025,
      endYear: 2027,
      isActive: true,
      notes: "Periode kepengurusan yang sedang berjalan.",
    },
  });
  void oldPeriod;

  console.log("Membuat struktur kepengurusan...");
  await prisma.position.createMany({
    data: [
      { title: "Ketua", userId: sekretaris.id, periodId: activePeriod.id, status: "AKTIF", order: 1 },
      { title: "Sekretaris", userId: sekretaris.id, periodId: activePeriod.id, status: "AKTIF", order: 2 },
      { title: "Bendahara", userId: bendahara.id, periodId: activePeriod.id, status: "AKTIF", order: 3 },
      {
        title: "Koordinator Ibadah",
        userId: anggotaMembers[0].id,
        periodId: activePeriod.id,
        status: "AKTIF",
        order: 4,
      },
      {
        title: "Koordinator Pelayanan Sosial",
        userId: anggotaMembers[2].id,
        periodId: activePeriod.id,
        status: "AKTIF",
        order: 5,
      },
    ],
  });

  console.log("Membuat kegiatan...");
  const daysFromNow = (n: number) => new Date(now.getTime() + n * 24 * 60 * 60 * 1000);

  const pastActivity1 = await prisma.activity.create({
    data: {
      name: "Ibadah Naposobulung Bulan Lalu",
      type: "IBADAH",
      description: "Ibadah rutin mingguan Naposobulung HKBP Immanuel Dumai.",
      date: daysFromNow(-30),
      location: "Gereja HKBP Immanuel Dumai",
      personInChargeId: sekretaris.id,
      status: "SELESAI",
      createdById: admin.id,
    },
  });

  const pastActivity2 = await prisma.activity.create({
    data: {
      name: "Bakti Sosial Panti Asuhan",
      type: "BAKTI_SOSIAL",
      description: "Kegiatan bakti sosial ke panti asuhan setempat.",
      date: daysFromNow(-14),
      location: "Panti Asuhan Kasih Dumai",
      personInChargeId: anggotaMembers[2].id,
      status: "SELESAI",
      createdById: admin.id,
    },
  });

  const upcomingActivity1 = await prisma.activity.create({
    data: {
      name: "Ibadah Naposobulung Minggu Ini",
      type: "IBADAH",
      description: "Ibadah rutin mingguan Naposobulung HKBP Immanuel Dumai.",
      date: daysFromNow(3),
      location: "Gereja HKBP Immanuel Dumai",
      personInChargeId: sekretaris.id,
      status: "DIRENCANAKAN",
      createdById: admin.id,
    },
  });

  const upcomingActivity2 = await prisma.activity.create({
    data: {
      name: "Retreat Naposobulung 2026",
      type: "RETREAT",
      description: "Kegiatan retreat tahunan untuk mempererat persekutuan.",
      date: daysFromNow(21),
      location: "Camp Ground Dumai",
      personInChargeId: anggotaMembers[0].id,
      status: "DIRENCANAKAN",
      createdById: admin.id,
    },
  });

  console.log("Mencatat kehadiran...");
  for (const [i, member] of anggotaMembers.entries()) {
    await prisma.attendance.create({
      data: {
        activityId: pastActivity1.id,
        userId: member.id,
        status: i % 3 === 0 ? "TIDAK_HADIR" : i % 5 === 0 ? "IZIN" : "HADIR",
        recordedById: sekretaris.id,
      },
    });
    await prisma.attendance.create({
      data: {
        activityId: pastActivity2.id,
        userId: member.id,
        status: i % 4 === 0 ? "SAKIT" : "HADIR",
        recordedById: sekretaris.id,
      },
    });
  }
  void upcomingActivity1;
  void upcomingActivity2;

  console.log("Mencatat pembayaran kas...");
  const MONTHLY_DUES = 20000;
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  for (const [i, member] of anggotaMembers.entries()) {
    // Bulan lalu: mayoritas lunas
    await prisma.cashPayment.create({
      data: {
        userId: member.id,
        month: currentMonth === 1 ? 12 : currentMonth - 1,
        year: currentMonth === 1 ? currentYear - 1 : currentYear,
        amount: MONTHLY_DUES,
        status: i === 6 ? "BELUM_BAYAR" : "LUNAS",
        method: "CASH",
        paymentDate: i === 6 ? null : daysFromNow(-20),
        recordedById: bendahara.id,
      },
    });
    // Bulan ini: sebagian lunas
    if (i % 2 === 0) {
      await prisma.cashPayment.create({
        data: {
          userId: member.id,
          month: currentMonth,
          year: currentYear,
          amount: MONTHLY_DUES,
          status: "LUNAS",
          method: i % 4 === 0 ? "TRANSFER" : "CASH",
          paymentDate: daysFromNow(-2),
          recordedById: bendahara.id,
        },
      });
    }
  }

  console.log("Mencatat ledger organisasi...");
  await prisma.transaction.createMany({
    data: [
      {
        type: "MASUK",
        category: "Donasi",
        amount: 500000,
        date: daysFromNow(-20),
        description: "Donasi dari jemaat",
      },
      {
        type: "KELUAR",
        category: "Konsumsi Acara",
        amount: 350000,
        date: daysFromNow(-14),
        description: "Konsumsi Bakti Sosial",
      },
      {
        type: "KELUAR",
        category: "Perlengkapan Ibadah",
        amount: 120000,
        date: daysFromNow(-7),
      },
    ],
  });

  console.log("Membuat pengumuman & forum...");
  const announcement = await prisma.post.create({
    data: {
      type: "PENGUMUMAN",
      title: "Jadwal Ibadah Bulan Ini",
      content:
        "Ibadah Naposobulung diadakan setiap hari Minggu pukul 16.00 WIB di Gereja HKBP Immanuel Dumai.",
      authorId: admin.id,
    },
  });
  void announcement;

  const forumPost = await prisma.post.create({
    data: {
      type: "FORUM",
      title: "Usulan tema retreat tahun ini",
      content: "Halo semua, ada usulan tema untuk retreat tahun ini?",
      authorId: anggotaMembers[0].id,
    },
  });
  await prisma.comment.createMany({
    data: [
      { postId: forumPost.id, authorId: anggotaMembers[1].id, content: "Setuju, kepemimpinan muda relevan!" },
      { postId: forumPost.id, authorId: sekretaris.id, content: "Baik, akan dibahas di rapat pengurus." },
    ],
  });

  void allMembers;

  console.log("\nSeed selesai.\n");
  console.log("Login Admin      : admin@nhid.church / admin123");
  console.log("Login Bendahara  : bendahara@nhid.church / pengurus123 (izin: kas)");
  console.log("Login Sekretaris : sekretaris@nhid.church / pengurus123 (izin: anggota, kegiatan, kehadiran)");
  console.log("Login Anggota    : daniel@nhid.church / anggota123 (dan anggota lain, password sama)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
