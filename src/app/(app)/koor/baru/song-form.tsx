"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SongForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [pageUrls, setPageUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleFilesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setFormError(null);
    setUploading(true);
    const urls: string[] = [];
    for (let i = 0; i < files.length; i++) {
      setUploadProgress(`Mengunggah halaman ${i + 1} dari ${files.length}...`);
      const formData = new FormData();
      formData.append("file", files[i]);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFormError(body.error || `Gagal mengunggah halaman ${i + 1}`);
        setUploading(false);
        setUploadProgress("");
        return;
      }
      urls.push(body.url);
    }
    setPageUrls((prev) => [...prev, ...urls]);
    setUploading(false);
    setUploadProgress("");
  };

  const removePage = (index: number) => {
    setPageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!title.trim()) {
      setFormError("Judul lagu wajib diisi");
      return;
    }
    if (pageUrls.length === 0) {
      setFormError("Unggah minimal 1 halaman partitur");
      return;
    }
    setSubmitting(true);
    const res = await fetch("/api/choir-songs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, pageUrls }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setFormError(body.error || "Gagal menyimpan lagu");
      return;
    }
    const { song } = await res.json();
    router.push(`/koor/${song.id}`);
    router.refresh();
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700">Judul Lagu</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Mis. Sursar"
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">
          Halaman Partitur (foto/scan, urutan sesuai pilihan file)
        </label>
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          multiple
          onChange={handleFilesChange}
          disabled={uploading}
          className="mt-1 text-sm"
        />
        {uploading && <p className="mt-1 text-xs text-slate-500">{uploadProgress}</p>}
      </div>

      {pageUrls.length > 0 && (
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
          {pageUrls.map((url, i) => (
            <div key={url} className="group relative aspect-[3/4] overflow-hidden rounded border border-slate-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`Halaman ${i + 1}`} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removePage(i)}
                className="absolute right-1 top-1 rounded bg-red-600/90 px-1 text-[10px] font-bold text-white opacity-0 group-hover:opacity-100"
              >
                Hapus
              </button>
              <span className="absolute bottom-0 left-0 bg-black/60 px-1 text-[10px] text-white">
                {i + 1}
              </span>
            </div>
          ))}
        </div>
      )}

      {formError && <p className="text-sm text-red-600">{formError}</p>}

      <button
        type="submit"
        disabled={submitting || uploading}
        className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
      >
        {submitting ? "Menyimpan..." : "Simpan Lagu"}
      </button>
    </form>
  );
}
