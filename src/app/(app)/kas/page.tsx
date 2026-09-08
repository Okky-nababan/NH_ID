import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { QueryParamSelect } from "@/components/query-param-select";
import { CashPaymentList } from "./cash-payment-list";
import { TransactionSection } from "./transaction-section";
import { SyncButton } from "./sync-button";

function formatDateInput(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default async function KasPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const session = await auth();
  const canView = hasPermission(session, "VIEW_CASH_REPORT");
  if (!canView) redirect("/kas-saya");

  const canManage = hasPermission(session, "MANAGE_CASH_PAYMENT");

  const { year: yearParam } = await searchParams;
  const year = Number(yearParam) || new Date().getFullYear();
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year + 1, 0, 1);

  const [payments, transactions, members, treasury] = await Promise.all([
    prisma.cashPayment.findMany({
      orderBy: [{ year: "desc" }, { month: "desc" }],
      include: { user: { select: { name: true } } },
      take: 100,
    }),
    prisma.transaction.findMany({
      where: { date: { gte: yearStart, lt: yearEnd } },
      orderBy: { date: "desc" },
      include: { user: { select: { name: true } } },
    }),
    prisma.user.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.treasurySummary.findUnique({ where: { id: "main" } }),
  ]);

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Uang Kas</h1>
          <p className="mt-1 text-sm text-slate-500">
            Pencatatan iuran bulanan anggota dan ledger organisasi.
          </p>
          {treasury && (
            <p className="mt-1 text-xs text-slate-400">
              Terakhir sinkron dari spreadsheet:{" "}
              {new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(
                treasury.syncedAt
              )}
            </p>
          )}
        </div>
        {canManage && <SyncButton />}
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-900">
            Ledger Organisasi <span className="font-normal text-slate-400">({transactions.length} transaksi di tahun {year})</span>
          </h2>
          <QueryParamSelect
            paramName="year"
            fallback={String(year)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            options={years.map((y) => ({ value: String(y), label: String(y) }))}
          />
        </div>
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
