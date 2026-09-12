import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api-auth";
import { uploadedFileUrl } from "@/lib/validation";

const photoSchema = z.object({
  photoUrl: uploadedFileUrl,
});

/**
 * Satu-satunya bagian biodata yang boleh anggota ubah sendiri SELAIN
 * password: foto profil. Sengaja dipisah dari kebijakan "biodata dikunci,
 * hanya Admin/Pengurus" -- foto tidak butuh persetujuan, anggota bebas
 * ganti kapan saja.
 */
export async function POST(request: Request) {
  const { session, error } = await requireUser();
  if (error) return error;

  const body = await request.json().catch(() => null);
  const parsed = photoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Data tidak valid", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const user = await prisma.user.update({
    where: { id: session!.user.id },
    data: { photoUrl: parsed.data.photoUrl },
  });

  return NextResponse.json({ user: { photoUrl: user.photoUrl } });
}
