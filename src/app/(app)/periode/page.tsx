import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { PeriodList } from "./period-list";

export default async function PeriodePage() {
  const session = await auth();
  const canManage = hasPermission(session, "MANAGE_PERIODS");

  const periods = await prisma.managementPeriod.findMany({
    orderBy: { startYear: "desc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Periode Kepengurusan</h1>
      <p className="mt-1 text-sm text-slate-500">
        Hanya boleh ada satu periode aktif pada satu waktu. Periode lama tetap tersimpan sebagai
        histori.
      </p>
      <div className="mt-6">
        <PeriodList
          periods={periods.map((p) => ({
            id: p.id,
            name: p.name,
            startYear: p.startYear,
            endYear: p.endYear,
            isActive: p.isActive,
            notes: p.notes ?? "",
          }))}
          canManage={canManage}
        />
      </div>
    </div>
  );
}
