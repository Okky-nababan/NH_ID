"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export function PhotoUploadForm({ name, initialPhotoUrl }: { name: string; initialPhotoUrl: string }) {
  const router = useRouter();
  const [photoUrl, setPhotoUrl] = useState(initialPhotoUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
    const uploadBody = await uploadRes.json().catch(() => ({}));
    if (!uploadRes.ok) {
      setUploading(false);
      setError(uploadBody.error || "Gagal mengunggah foto");
      return;
    }

    const saveRes = await fetch("/api/profile/photo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photoUrl: uploadBody.url }),
    });
    setUploading(false);
    if (!saveRes.ok) {
      const saveBody = await saveRes.json().catch(() => ({}));
      setError(saveBody.error || "Gagal menyimpan foto");
      return;
    }

    setPhotoUrl(uploadBody.url);
    router.refresh();
  };

  return (
    <div className="flex items-center gap-4">
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-blue-100">
        {photoUrl ? (
          <Image src={photoUrl} alt="Foto profil" fill className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-blue-700">
            {name.slice(0, 2).toUpperCase()}
          </div>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Ganti Foto Profil</label>
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={handlePhotoChange}
          disabled={uploading}
          className="mt-1 text-sm"
        />
        {uploading && <p className="text-xs text-slate-500">Mengunggah...</p>}
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    </div>
  );
}
