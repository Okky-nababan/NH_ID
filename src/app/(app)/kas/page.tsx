import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { CashPaymentList } from "./cash-payment-list";
import { TransactionSection } from "./transaction-section";

function formatDateInput(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default async function KasPage() {
  const session = await auth();
  const canView = hasPermission(session, "VIEW_CASH_REPORT");
  if (!canView) redirect("/kas-saya");

  const canManage = hasPermission(session, "MANAGE_CASH_PAYMENT");

  const [payments, transactions, members] = await Promise.all([
    prisma.cashPayment.findMany({
      orderBy: [{ year: "desc" }, { month: "desc" }],
      include: { user: { select: { name: true } } },
      take: 100,
    }),
    prisma.transaction.findMany({
      orderBy: { date: "desc" },
      include: { user: { select: { name: true } } },
      take: 100,
    }),
    prisma.user.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Uang Kas</h1>
        <p className="mt-1 text-sm text-slate-500">
          Pencatatan iuran bulanan anggota dan ledger organisasi.
        </p>
      </div>

      <section>
        <h2 className="text-base font-semibold text-slate-900">Iuran Bulanan Anggota</h2>
        <div className="mt-3">
          <CashPaymentList
            payments={payments.map((p) => ({
              id: p.id,
              userId: p.userId,
              userName: p.user.name,
              month: p.month,
              year: p.year,
              amount: p.amount,
              status: p.status,
              method: p.method,
              notes: p.notes ?? "",
              paymentDate: p.paymentDate ? formatDateInput(p.paymentDate) : "",
            }))}
            members={members}
            canManage={canManage}
          />
        </div>
      </section>

      <section>
        <h2 className="text-base font-semibold text-slate-900">Ledger Organisasi</h2>
        <div className="mt-3">
          <TransactionSection
            transactions={transactions.map((t) => ({
              id: t.id,
              type: t.type,
              category: t.category,
              amount: t.amount,
              description: t.description ?? "",
              date: formatDateInput(t.date),
              userName: t.user?.name ?? "",
            }))}
            members={members}
            canManage={canManage}
          />
        </div>
      </section>
    </div>
  );
}
