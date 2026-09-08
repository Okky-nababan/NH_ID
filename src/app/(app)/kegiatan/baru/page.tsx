import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { ActivityForm } from "../activity-form";

export default async function NewActivityPage() {
  const session = await auth();
  if (!hasPermission(session, "MANAGE_ACTIVITIES")) redirect("/kegiatan");

  const members = await prisma.user.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-xl font-bold text-slate-900">Kegiatan Baru</h1>
      <div className="mt-4 rounded-lg border border-slate-200 bg-white p-6">
        <ActivityForm members={members} />
      </div>
    </div>
  );
}
