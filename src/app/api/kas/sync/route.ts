import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";
import { fetchAllTransactions, fetchTreasurySummary, fetchAllDues } from "@/lib/sheet-sync";

/**
 * Tarik ulang data terbaru dari spreadsheet Bendahara (Google Sheets) dan
 * timpa ulang transaksi hasil sinkron sebelumnya (transaksi yang ditambah
 * manual lewat web — syncedFromSheet=false — TIDAK disentuh).
 *
 * Dipicu dari 2 jalur:
 * 1. Manual (POST): tombol "Sinkronkan dari Spreadsheet" di halaman /kas
 *    (perlu login + permission MANAGE_CASH_PAYMENT).
 * 2. Otomatis (GET): cron harian Vercel (lihat vercel.json) — Vercel
 *    memanggil dengan GET + header Authorization: Bearer <CRON_SECRET>.
 */
async function runSync(request: Request, actorUserId: string | null, isCron: boolean) {
  try {
    const [transactions, summary, dues] = await Promise.all([
      fetchAllTransactions(),
      fetchTreasurySummary(),
      fetchAllDues(),
    ]);

    await prisma.$transaction([
      prisma.transaction.deleteMany({ where: { syncedFromSheet: true } }),
      prisma.transaction.createMany({
        data: transactions.map((t) => ({
          type: t.type,
          category: t.category,
          amount: t.amount,
          description: t.description.slice(0, 250),
          date: t.date,
          syncedFromSheet: true,
        })),
      }),
      prisma.treasurySummary.upsert({
        where: { id: "main" },
        update: {
          saldoResmi: summary.saldoResmi,
          asOfLabel: summary.asOfLabel,
          cumAmount: summary.cumAmount,
          bendaharaAmount: summary.bendaharaAmount,
          syncedAt: new Date(),
        },
        create: {
          id: "main",
          saldoResmi: summary.saldoResmi,
          asOfLabel: summary.asOfLabel,
          cumAmount: summary.cumAmount,
          bendaharaAmount: summary.bendaharaAmount,
        },
      }),
    ]);

    // Upsert iuran satu per satu (bukan dalam satu $transaction besar) --
    // 36 statement (3 tahun x 12 bulan) sering melebihi batas waktu
    // transaksi interaktif Neon. Masing-masing upsert sudah atomik sendiri.
    for (const yearData of dues) {
      for (const m of yearData.months) {
        await prisma.duesMonthlySummary.upsert({
          where: { year_month: { year: yearData.year, month: m.month } },
          update: {
            totalAmount: m.totalAmount,
            paidCount: m.paidCount,
            memberCount: yearData.memberCount,
            syncedAt: new Date(),
          },
          create: {
            year: yearData.year,
            month: m.month,
            totalAmount: m.totalAmount,
            paidCount: m.paidCount,
            memberCount: yearData.memberCount,
          },
        });
      }
    }

    const duesMemberTotal = dues.reduce((sum, y) => sum + y.memberCount, 0);
    await logAudit({
      userId: actorUserId,
      action: "SYNC_CASH_SHEET",
      module: "transaction",
      description: `Sinkronisasi dari spreadsheet Bendahara: ${transactions.length} transaksi, saldo resmi Rp${summary.saldoResmi.toLocaleString("id-ID")} (per ${summary.asOfLabel}), iuran ${duesMemberTotal} baris anggota di ${dues.length} tahun${isCron ? " [otomatis/cron]" : ""}`,
      request,
    });

    return NextResponse.json({ success: true, count: transactions.length, summary });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Gagal menyinkronkan data";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

/** Dipanggil manual dari tombol di halaman /kas. */
export async function POST(request: Request) {
  const { session, error } = await requirePermission(
    "MANAGE_CASH_PAYMENT",
    "Anda tidak memiliki izin untuk mengelola pembayaran kas."
  );
  if (error) return error;
  return runSync(request, session!.user.id, false);
}

/** Dipanggil otomatis oleh cron Vercel (lihat vercel.json). */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const isAuthorizedCron =
    !!process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`;
  if (!isAuthorizedCron) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return runSync(request, null, true);
}
