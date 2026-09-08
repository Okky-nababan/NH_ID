import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NewPostForm } from "./new-post-form";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(
    date
  );
}

export default async function PengumumanPage() {
  const session = await auth();
  const posts = await prisma.post.findMany({
    orderBy: [{ type: "asc" }, { createdAt: "desc" }],
    include: {
      author: { select: { name: true } },
      _count: { select: { comments: true } },
    },
  });

  const announcements = posts.filter((p) => p.type === "PENGUMUMAN");
  const forumPosts = posts.filter((p) => p.type === "FORUM");

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pengumuman & Forum</h1>
          <p className="mt-1 text-sm text-slate-500">
            Informasi resmi dan diskusi antar anggota.
          </p>
        </div>
      </div>

      <section>
        <h2 className="text-base font-semibold text-slate-900">Pengumuman</h2>
        <div className="mt-3 space-y-3">
          {announcements.length > 0 ? (
            announcements.map((p) => (
              <Link
                key={p.id}
                href={`/pengumuman/${p.id}`}
                className="block rounded-lg border border-blue-100 bg-blue-50/50 p-4 hover:border-blue-300"
              >
                <h3 className="font-semibold text-slate-900">{p.title}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-slate-600">{p.content}</p>
                <p className="mt-2 text-xs text-slate-500">
                  {p.author.name} &middot; {formatDate(p.createdAt)}
                </p>
              </Link>
            ))
          ) : (
            <p className="text-sm text-slate-500">Belum ada pengumuman.</p>
          )}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Forum Diskusi</h2>
        </div>
        <div className="mt-3">
          <NewPostForm isAdmin={session!.user.role === "ADMIN"} />
        </div>
        <div className="mt-4 space-y-3">
          {forumPosts.length > 0 ? (
            forumPosts.map((p) => (
              <Link
                key={p.id}
                href={`/pengumuman/${p.id}`}
                className="block rounded-lg border border-slate-200 bg-white p-4 hover:border-blue-300 hover:shadow-sm"
              >
                <h3 className="font-semibold text-slate-900">{p.title}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-slate-600">{p.content}</p>
                <p className="mt-2 text-xs text-slate-500">
                  {p.author.name} &middot; {formatDate(p.createdAt)} &middot; {p._count.comments}{" "}
                  komentar
                </p>
              </Link>
            ))
          ) : (
            <p className="text-sm text-slate-500">Belum ada diskusi forum.</p>
          )}
        </div>
      </section>
    </div>
  );
}
