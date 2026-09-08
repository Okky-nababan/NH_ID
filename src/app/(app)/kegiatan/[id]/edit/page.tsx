import { redirect, notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { ActivityForm } from "../../activity-form";

function toLocalInput(date: Date) {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

export default async function EditActivityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!hasPermission(session, "MANAGE_ACTIVITIES")) redirect("/kegiatan");

  const { id } = await params;
  const [activity, members] = await Promise.all([
    prisma.activity.findUnique({ where: { id } }),
    prisma.user.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);
  if (!activity) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-xl font-bold text-slate-900">Edit Kegiatan</h1>
      <div className="mt-4 rounded-lg border border-slate-200 bg-white p-6">
        <ActivityForm
          activityId={activity.id}
          members={members}
          initial={{
            name: activity.name,
            type: activity.type,
            description: activity.description,
            date: toLocalInput(activity.date),
            location: activity.location,
            personInChargeId: activity.personInChargeId ?? "",
            status: activity.status,
            notes: activity.notes ?? "",
            photoUrl: activity.photoUrl ?? "",
          }}
        />
      </div>
    </div>
  );
}
