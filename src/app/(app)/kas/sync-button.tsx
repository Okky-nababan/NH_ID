"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SyncButton() {
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  const onSync = async () => {
    if (
      !confirm(
        "Tarik ulang data terbaru dari spreadsheet Bendahara? Transaksi hasil sinkron sebelumnya akan diganti dengan versi terbaru (transaksi yang Anda tambah manual tidak akan terhapus)."
      )
    ) {
      return;
    }
    setMessage(null);
    setIsError(false);
    setSyncing(true);
    const res = await fetch("/api/kas/sync", { method: "POST" });
    const body = await res.json().catch(() => ({}));
    setSyncing(false);
    if (!res.ok) {
      setIsError(true);
      setMessage(body.error || "Gagal menyinkronkan data");
      return;
    }
    setMessage(
      `Berhasil: ${body.count} transaksi tersinkron, saldo resmi Rp${body.summary.saldoResmi.toLocaleString("id-ID")} (per ${body.summary.asOfLabel}).`
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
        {syncing ? "Menyinkronkan..." : "Sinkronkan dari Spreadsheet"}
      </button>
      {message && (
        <p className={`mt-1 text-xs ${isError ? "text-red-600" : "text-green-600"}`}>{message}</p>
      )}
    </div>
  );
}
