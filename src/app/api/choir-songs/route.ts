import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, requirePermission } from "@/lib/api-auth";
import { choirSongSchema } from "@/lib/validation";
import { logAudit } from "@/lib/audit";

/** Daftar judul lagu koor — bisa dilihat semua anggota yang sudah login. */
export async function GET() {
  const { error } = await requireUser();
  if (error) return error;

  const songs = await prisma.choirSong.findMany({
    orderBy: [{ order: "asc" }, { title: "asc" }],
    select: {
      id: true,
      title: true,
      order: true,
      _count: { select: { pages: true } },
    },
  });

  return NextResponse.json({ songs });
}

/** Tambah lagu baru + halaman partiturnya — hanya user berizin MANAGE_CHOIR. */
export async function POST(request: Request) {
  const { session, error } = await requirePermission(
    "MANAGE_CHOIR",
    "Anda tidak memiliki izin untuk mengelola partitur koor."
  );
  if (error) return error;

  const body = await request.json().catch(() => null);
  const parsed = choirSongSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Data tidak valid", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const data = parsed.data;

  const song = await prisma.choirSong.create({
    data: {
      title: data.title,
      order: data.order ?? 0,
      createdById: session!.user.id,
      pages: {
        create: data.pageUrls.map((imageUrl, i) => ({ pageNumber: i + 1, imageUrl })),
      },
    },
  });

  await logAudit({
    userId: session!.user.id,
    action: "CREATE_CHOIR_SONG",
    module: "choir_song",
    recordId: song.id,
    description: `Menambahkan lagu koor: ${song.title} (${data.pageUrls.length} halaman)`,
    request,
  });

  return NextResponse.json({ song }, { status: 201 });
}
