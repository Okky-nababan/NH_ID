"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { postSchema, type PostInput } from "@/lib/validation";

export function NewPostForm({ isAdmin }: { isAdmin: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PostInput>({
    resolver: zodResolver(postSchema),
    defaultValues: { type: "FORUM" },
  });

  const onSubmit = async (data: PostInput) => {
    setFormError(null);
    setSubmitting(true);
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setSubmitting(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setFormError(body.error || "Gagal membuat post");
      return;
    }

    reset({ type: "FORUM", title: "", content: "" });
    setOpen(false);
    router.refresh();
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
      >
        + Buat Diskusi Baru
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-3 rounded-lg border border-slate-200 bg-white p-4"
    >
      {isAdmin && (
        <div>
          <label className="block text-sm font-medium text-slate-700">Jenis</label>
          <select
            {...register("type")}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="FORUM">Diskusi Forum</option>
            <option value="PENGUMUMAN">Pengumuman</option>
          </select>
        </div>
      )}

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

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {submitting ? "Mengirim..." : "Kirim"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-md px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-50"
        >
          Batal
        </button>
      </div>
    </form>
  );
}
