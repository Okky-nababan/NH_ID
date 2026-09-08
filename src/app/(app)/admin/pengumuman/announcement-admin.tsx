"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { postSchema, type PostInput } from "@/lib/validation";

type Row = { id: string; title: string; content: string; createdAt: string };

function AnnouncementForm({
  postId,
  initial,
  onSaved,
}: {
  postId?: string;
  initial?: Partial<PostInput>;
  onSaved: () => void;
}) {
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PostInput>({
    resolver: zodResolver(postSchema),
    defaultValues: { type: "PENGUMUMAN", ...initial },
  });

  const onSubmit = async (data: PostInput) => {
    setFormError(null);
    setSubmitting(true);
    const res = await fetch(postId ? `/api/posts/${postId}` : "/api/posts", {
      method: postId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, type: "PENGUMUMAN" }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setFormError(body.error || "Gagal menyimpan pengumuman");
      return;
    }
    if (!postId) reset({ type: "PENGUMUMAN", title: "", content: "" });
    onSaved();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-slate-700">Judul</label>
        <input
          type="text"
          {...register("title")}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Isi</label>
        <textarea
          rows={4}
          {...register("content")}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        {errors.content && (
          <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>
        )}
      </div>
      {formError && <p className="text-sm text-red-600">{formError}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
      >
        {submitting ? "Menyimpan..." : postId ? "Simpan Perubahan" : "Terbitkan Pengumuman"}
      </button>
    </form>
  );
}

export function AnnouncementAdmin({ posts }: { posts: Row[] }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const remove = async (id: string) => {
    if (!confirm("Hapus pengumuman ini?")) return;
    setBusyId(id);
    const res = await fetch(`/api/posts/${id}`, { method: "DELETE" });
    setBusyId(null);
    if (res.ok) router.refresh();
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-slate-900">Pengumuman Baru</h2>
        <div className="mt-4">
          <AnnouncementForm onSaved={() => router.refresh()} />
        </div>
      </div>

      <div className="space-y-3">
        {posts.map((p) =>
          editingId === p.id ? (
            <div key={p.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <AnnouncementForm
                postId={p.id}
                initial={{ title: p.title, content: p.content }}
                onSaved={() => {
                  setEditingId(null);
                  router.refresh();
                }}
              />
              <button
                onClick={() => setEditingId(null)}
                className="mt-2 text-sm text-slate-500 hover:underline"
              >
                Batal
              </button>
            </div>
          ) : (
            <div key={p.id} className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-slate-900">{p.title}</h3>
                  <p className="mt-1 text-sm text-slate-600">{p.content}</p>
                  <p className="mt-1 text-xs text-slate-400">{p.createdAt}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={() => setEditingId(p.id)}
                    className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Edit
                  </button>
                  <button
                    disabled={busyId === p.id}
                    onClick={() => remove(p.id)}
                    className="rounded-md border border-red-200 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
