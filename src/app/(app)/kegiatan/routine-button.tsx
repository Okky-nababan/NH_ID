"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RoutineButton() {
  const router = useRouter();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  const onGenerate = async () => {
    setMessage(null);
    setIsError(false);
    setLoading(true);
    const payload: Record<string, string> = {};
    if (startDate) payload.startDate = startDate;
    if (endDate) payload.endDate = endDate;
    const res = await fetch("/api/activities/routine", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setIsError(true);
      setMessage(body.error || "Gagal membuat jadwal rutin");
      return;
    }

    setMessage(
      body.created > 0
        ? `${body.created} jadwal Selasa/Jumat berhasil dibuat.`
        : "Tidak ada jadwal baru yang perlu ditambahkan pada rentang ini."
    );
    router.refresh();
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        type="date"
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
        title="Mulai dari tanggal (opsional, kosongkan untuk mulai hari ini)"
        className="rounded-md border border-slate-300 px-2 py-2 text-sm"
      />
      <span className="text-sm text-slate-400">s/d</span>
      <input
        type="date"
        value={endDate}
        onChange={(e) => setEndDate(e.target.value)}
        title="Sampai tanggal (opsional, kosongkan untuk 60 hari ke depan)"
        className="rounded-md border border-slate-300 px-2 py-2 text-sm"
      />
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
    </div>
  );
}
