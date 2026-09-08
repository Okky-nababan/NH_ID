import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { QueryParamSelect } from "@/components/query-param-select";
import { PositionBoard } from "./position-board";

export default async function KepengurusanPage({
  searchParams,
}: {
  searchParams: Promise<{ periodId?: string }>;
}) {
  const session = await auth();
  const canManage = hasPermission(session, "MANAGE_POSITIONS");

  const periods = await prisma.managementPeriod.findMany({
    orderBy: { startYear: "desc" },
  });
  const activePeriod = periods.find((p) => p.isActive) ?? periods[0];

  const { periodId } = await searchParams;
  const selectedPeriodId = periodId ?? activePeriod?.id ?? "";

  const [positions, members] = await Promise.all([
    selectedPeriodId
      ? prisma.position.findMany({
          where: { periodId: selectedPeriodId },
          orderBy: [{ order: "asc" }, { createdAt: "asc" }],
          include: { user: { select: { id: true, name: true, photoUrl: true } } },
        })
      : Promise.resolve([]),
    prisma.user.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Kepengurusan</h1>
          <p className="mt-1 text-sm text-slate-500">Struktur organisasi Naposobulung.</p>
        </div>
        {periods.length > 0 && (
          <QueryParamSelect
            paramName="periodId"
            fallback={selectedPeriodId}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            options={periods.map((p) => ({
              value: p.id,
              label: `${p.name}${p.isActive ? " (Aktif)" : ""}`,
            }))}
          />
        )}
      </div>

      <div className="mt-6">
        {periods.length === 0 ? (
          <p className="text-sm text-slate-500">
            Belum ada periode kepengurusan. Buat periode terlebih dahulu di menu Periode.
          </p>
        ) : (
          <PositionBoard
            positions={positions.map((p) => ({
              id: p.id,
              title: p.title,
              userId: p.userId,
              memberName: p.memberName,
              displayName: p.user?.name ?? p.memberName ?? "-",
              userPhoto: p.user?.photoUrl ?? null,
              periodId: p.periodId,
              status: p.status,
              order: p.order,
            }))}
            members={members}
            periods={periods.map((p) => ({ id: p.id, name: p.name }))}
            activePeriodId={selectedPeriodId}
            canManage={canManage}
          />
        )}
      </div>
    </div>
  );
}
