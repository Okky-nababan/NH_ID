"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SyncNamesButton() {
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  const onSync = async () => {
    setMessage(null);
    setIsError(false);
    setSyncing(true);
    const res = await fetch("/api/positions/sync-names", { method: "POST" });
    const body = await res.json().catch(() => ({}));
    setSyncing(false);
    if (!res.ok) {
      setIsError(true);
      setMessage(body.error || "Gagal menyinkronkan nama");
      return;
    }
    setMessage(
      body.linked > 0
        ? `Berhasil: ${body.linked} jabatan terhubung ke akun anggota.`
        : "Semua jabatan sudah sesuai — tidak ada yang perlu dihubungkan."
    );
    router.refresh();
  };

  return (
    <div>
      <button
        type="button"
        onClick={onSync}
        disabled={syncing}
        className="rounded-md border border-brand px-3 py-2 text-sm font-semibold text-brand hover:bg-blue-50 disabled:opacity-60"
      >
        {syncing ? "Menyinkronkan..." : "Sinkronkan Nama dengan Anggota"}
      </button>
      {message && (
        <p className={`mt-1 text-xs ${isError ? "text-red-600" : "text-green-600"}`}>{message}</p>
      )}
    </div>
  );
}
