"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function PostDeleteButton({ postId }: { postId: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDelete = async () => {
    if (!confirm("Hapus post ini beserta seluruh komentarnya?")) return;
    setError(null);
    setDeleting(true);
    const res = await fetch(`/api/posts/${postId}`, { method: "DELETE" });
    setDeleting(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error || "Gagal menghapus post");
      return;
    }
    router.push("/pengumuman");
    router.refresh();
  };

  return (
    <div className="mt-2">
      <button
        type="button"
        disabled={deleting}
        onClick={onDelete}
        className="rounded-md border border-red-200 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
      >
        {deleting ? "Menghapus..." : "Hapus"}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
