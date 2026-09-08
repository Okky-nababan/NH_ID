import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api-auth";
import { profileUpdateSchema } from "@/lib/validation";

/** Self-service: anggota hanya boleh mengubah profil miliknya sendiri. */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireUser();
  if (error) return error;

  const { id } = await params;
  if (session!.user.id !== id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = profileUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Data tidak valid", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { name, phone, address, birthDate, photoUrl } = parsed.data;

  const user = await prisma.user.update({
    where: { id },
    data: {
      name,
      phone,
      address: address || null,
      birthDate: birthDate ? new Date(birthDate) : null,
      photoUrl: photoUrl || null,
    },
  });

  return NextResponse.json({ user });
}
