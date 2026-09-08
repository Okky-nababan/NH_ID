import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { SongDeleteButton } from "./song-delete-button";

export default async function ChoirSongDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const canManage = hasPermission(session, "MANAGE_CHOIR");

  const song = await prisma.choirSong.findUnique({
    where: { id },
    include: { pages: { orderBy: { pageNumber: "asc" } } },
  });
  if (!song) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <Link href="/koor" className="text-xs text-slate-500 hover:underline">
            &larr; Partitur Koor
          </Link>
          <h1 className="mt-1 text-xl font-bold text-slate-900">{song.title}</h1>
          <p className="text-sm text-slate-500">{song.pages.length} halaman</p>
        </div>
        {canManage && <SongDeleteButton songId={song.id} />}
      </div>

      <div className="space-y-3">
        {song.pages.map((p) => (
          <div key={p.id} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <div className="relative w-full" style={{ aspectRatio: "3 / 4" }}>
              <Image
                src={p.imageUrl}
                alt={`${song.title} - halaman ${p.pageNumber}`}
                fill
                unoptimized
                className="object-contain"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
