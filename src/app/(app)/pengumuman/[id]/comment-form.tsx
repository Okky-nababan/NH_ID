"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { commentSchema, type CommentInput } from "@/lib/validation";

export function CommentForm({ postId }: { postId: string }) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CommentInput>({ resolver: zodResolver(commentSchema) });

  const onSubmit = async (data: CommentInput) => {
    setFormError(null);
    setSubmitting(true);
    const res = await fetch(`/api/posts/${postId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setSubmitting(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setFormError(body.error || "Gagal mengirim komentar");
      return;
    }

    reset({ content: "" });
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
      <textarea
        rows={3}
        placeholder="Tulis komentar..."
        {...register("content")}
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      {errors.content && <p className="text-sm text-red-600">{errors.content.message}</p>}
      {formError && <p className="text-sm text-red-600">{formError}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
      >
        {submitting ? "Mengirim..." : "Kirim Komentar"}
      </button>
    </form>
  );
}
