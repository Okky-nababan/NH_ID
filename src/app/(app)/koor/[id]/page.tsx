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
        {song.pages.map((p) => {
          const isPdf = p.imageUrl.toLowerCase().endsWith(".pdf");
          return (
            <div key={p.id} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
              {isPdf ? (
                <div>
                  <embed
                    src={p.imageUrl}
                    type="application/pdf"
                    className="h-[80vh] w-full"
                    aria-label={`${song.title} - halaman ${p.pageNumber} (PDF)`}
                  />
                  <div className="flex items-center justify-between gap-2 border-t border-slate-100 px-3 py-2">
                    <span className="text-xs text-slate-500">
                      Halaman {p.pageNumber} · PDF. Kalau tidak tampil (mis. di HP), buka
                      langsung:
                    </span>
                    <a
                      href={p.imageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Buka PDF
                    </a>
                  </div>
                </div>
              ) : (
                <div className="relative w-full" style={{ aspectRatio: "3 / 4" }}>
                  <Image
                    src={p.imageUrl}
                    alt={`${song.title} - halaman ${p.pageNumber}`}
                    fill
                    unoptimized
                    className="object-contain"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
