import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { CommentForm } from "./comment-form";
import { PostDeleteButton } from "./post-delete-button";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(
    date
  );
}

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      author: { select: { name: true } },
      comments: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { name: true } } },
      },
    },
  });

  if (!post) notFound();

  const canDelete = session!.user.id === post.authorId || session!.user.role === "ADMIN";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        {post.type === "PENGUMUMAN" && (
          <span className="rounded bg-blue-50 px-1.5 py-0.5 text-xs font-medium text-blue-700">
            Pengumuman
          </span>
        )}
        <h1 className="mt-2 text-xl font-bold text-slate-900">{post.title}</h1>
        <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{post.content}</p>
        <p className="mt-3 text-xs text-slate-500">
          {post.author.name} &middot; {formatDate(post.createdAt)}
        </p>
        {canDelete && <PostDeleteButton postId={post.id} />}
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-slate-900">
          Komentar ({post.comments.length})
        </h2>
        <div className="mt-4 space-y-4">
          {post.comments.map((c) => (
            <div key={c.id} className="border-b border-slate-100 pb-3 last:border-0">
              <p className="text-sm font-medium text-slate-900">{c.author.name}</p>
              <p className="mt-1 text-sm text-slate-600">{c.content}</p>
              <p className="mt-1 text-xs text-slate-400">{formatDate(c.createdAt)}</p>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <CommentForm postId={post.id} />
        </div>
      </div>
    </div>
  );
}
