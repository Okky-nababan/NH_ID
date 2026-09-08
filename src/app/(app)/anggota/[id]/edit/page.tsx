import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { MemberForm } from "../../member-form";

export default async function EditMemberPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!hasPermission(session, "MANAGE_MEMBERS")) redirect("/anggota");

  const { id } = await params;
  const member = await prisma.user.findUnique({ where: { id } });
  if (!member) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-xl font-bold text-slate-900">Edit Anggota</h1>
      <div className="mt-4 rounded-lg border border-slate-200 bg-white p-6">
        <MemberForm
          memberId={member.id}
          initial={{
            name: member.name,
            nickname: member.nickname ?? "",
            email: member.email,
            phone: member.phone,
            gender: member.gender ?? undefined,
            birthPlace: member.birthPlace ?? "",
            birthDate: member.birthDate ? member.birthDate.toISOString().slice(0, 10) : "",
            address: member.address ?? "",
            memberNumber: member.memberNumber ?? "",
            membershipStatus: member.membershipStatus,
            notes: member.notes ?? "",
            photoUrl: member.photoUrl ?? "",
          }}
        />
      </div>
    </div>
  );
}
