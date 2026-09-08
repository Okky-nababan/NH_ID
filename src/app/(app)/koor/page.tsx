import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";

export default async function KoorPage() {
  const session = await auth();
  const canManage = hasPermission(session, "MANAGE_CHOIR");

  const songs = await prisma.choirSong.findMany({
    orderBy: [{ order: "asc" }, { title: "asc" }],
    select: { id: true, title: true, _count: { select: { pages: true } } },
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Partitur Koor</h1>
          <p className="mt-1 text-sm text-slate-500">{songs.length} judul lagu tersedia.</p>
        </div>
        {canManage && (
          <Link
            href="/koor/baru"
            className="rounded-md bg-brand px-3 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            + Tambah Lagu
          </Link>
        )}
      </div>

      {songs.length === 0 ? (
        <p className="mt-6 text-sm text-slate-500">Belum ada partitur koor yang diunggah.</p>
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {songs.map((s) => (
            <Link
              key={s.id}
              href={`/koor/${s.id}`}
              className="rounded-lg border border-slate-200 bg-white p-4 hover:border-brand hover:shadow-sm"
            >
              <p className="font-semibold text-slate-900">{s.title}</p>
              <p className="mt-1 text-xs text-slate-500">{s._count.pages} halaman</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
