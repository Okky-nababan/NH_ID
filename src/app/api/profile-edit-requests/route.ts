import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api-auth";
import { profileEditRequestSchema } from "@/lib/validation";

/**
 * Anggota mengajukan permintaan perubahan biodata (nama, alamat, tanggal
 * lahir, dll) -- anggota TIDAK bisa mengedit langsung. Admin/Pengurus
 * melihat & memprosesnya di /admin/profile-edit-requests.
 */
export async function POST(request: Request) {
  const { session, error } = await requireUser();
  if (error) return error;

  const body = await request.json().catch(() => null);
  const parsed = profileEditRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Data tidak valid", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  await prisma.profileEditRequest.create({
    data: {
      userId: session!.user.id,
      message: parsed.data.message,
    },
  });

  return NextResponse.json({ success: true }, { status: 201 });
}
