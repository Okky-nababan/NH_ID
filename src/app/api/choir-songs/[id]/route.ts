import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, requirePermission } from "@/lib/api-auth";
import { choirSongSchema } from "@/lib/validation";
import { logAudit } from "@/lib/audit";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireUser();
  if (error) return error;

  const { id } = await params;
  const song = await prisma.choirSong.findUnique({
    where: { id },
    include: { pages: { orderBy: { pageNumber: "asc" } } },
  });

  if (!song) {
    return NextResponse.json({ error: "Lagu tidak ditemukan" }, { status: 404 });
  }

  return NextResponse.json({ song });
}

/** Ganti judul/urutan lagu — halaman partitur tidak diubah lewat endpoint ini. */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requirePermission(
    "MANAGE_CHOIR",
    "Anda tidak memiliki izin untuk mengelola partitur koor."
  );
  if (error) return error;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = choirSongSchema
    .pick({ title: true, order: true })
    .safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Data tidak valid", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const song = await prisma.choirSong.update({
    where: { id },
    data: { title: parsed.data.title, order: parsed.data.order ?? 0 },
  });

  await logAudit({
    userId: session!.user.id,
    action: "UPDATE_CHOIR_SONG",
    module: "choir_song",
    recordId: song.id,
    description: `Mengubah lagu koor: ${song.title}`,
    request,
  });

  return NextResponse.json({ song });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requirePermission(
    "MANAGE_CHOIR",
    "Anda tidak memiliki izin untuk mengelola partitur koor."
  );
  if (error) return error;

  const { id } = await params;
  const song = await prisma.choirSong.delete({ where: { id } });

  await logAudit({
    userId: session!.user.id,
    action: "DELETE_CHOIR_SONG",
    module: "choir_song",
    recordId: id,
    description: `Menghapus lagu koor: ${song.title}`,
    request,
  });

  return NextResponse.json({ success: true });
}
