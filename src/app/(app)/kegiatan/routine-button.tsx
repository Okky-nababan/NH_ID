"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RoutineButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  const onGenerate = async () => {
    setMessage(null);
    setIsError(false);
    setLoading(true);
    const res = await fetch("/api/activities/routine", { method: "POST" });
    const body = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setIsError(true);
      setMessage(body.error || "Gagal membuat jadwal rutin");
      return;
    }

    setMessage(
      body.created > 0
        ? `${body.created} jadwal Selasa/Jumat berhasil dibuat untuk 60 hari ke depan.`
        : "Jadwal Selasa/Jumat untuk 60 hari ke depan sudah lengkap, tidak ada yang perlu ditambahkan."
    );
    router.refresh();
  };

  return (
    <div>
      <button
        type="button"
        onClick={onGenerate}
        disabled={loading}
        className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        title="Isi otomatis jadwal persekutuan rutin Selasa & Jumat yang belum ada, supaya tidak ada yang ketinggalan"
      >
        {loading ? "Membuat jadwal..." : "Buat Jadwal Rutin"}
      </button>
      {message && (
        <p className={`mt-1 text-xs ${isError ? "text-red-600" : "text-green-600"}`}>{message}</p>
      )}
    </div>
  );
}
