"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SongDeleteButton({ songId }: { songId: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDelete = async () => {
    if (!confirm("Hapus lagu koor ini beserta seluruh halaman partiturnya?")) return;
    setError(null);
    setDeleting(true);
    const res = await fetch(`/api/choir-songs/${songId}`, { method: "DELETE" });
    setDeleting(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error || "Gagal menghapus lagu");
      return;
    }
    router.push("/koor");
    router.refresh();
  };

  return (
    <div className="shrink-0 text-right">
      <button
        type="button"
        disabled={deleting}
        onClick={onDelete}
        className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
      >
        {deleting ? "Menghapus..." : "Hapus Lagu"}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
