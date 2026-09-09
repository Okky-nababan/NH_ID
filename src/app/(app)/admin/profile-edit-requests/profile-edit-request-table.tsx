"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Row = {
  id: string;
  userId: string;
  userName: string;
  message: string;
  status: "PENDING" | "DONE";
  createdAt: string;
  resolvedByName: string;
};

export function ProfileEditRequestTable({ requests }: { requests: Row[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pending = requests.filter((r) => r.status === "PENDING");
  const done = requests.filter((r) => r.status === "DONE");

  const resolve = async (id: string) => {
    setBusyId(id);
    setError(null);
    const res = await fetch(`/api/profile-edit-requests/${id}`, { method: "PATCH" });
    setBusyId(null);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error || "Gagal memproses permintaan");
      return;
    }
    router.refresh();
  };

  return (
    <div className="space-y-6">
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
          Menunggu diproses ({pending.length})
        </div>
        {pending.length === 0 ? (
          <p className="px-4 py-4 text-sm text-slate-500">Tidak ada permintaan yang menunggu.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {pending.map((r) => (
              <div key={r.id} className="flex flex-wrap items-start justify-between gap-3 px-4 py-3">
                <div>
                  <Link
                    href={`/anggota/${r.userId}/edit`}
                    className="text-sm font-medium text-brand hover:underline"
                  >
                    {r.userName}
                  </Link>
                  <p className="mt-1 text-sm text-slate-700">&quot;{r.message}&quot;</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(
                      new Date(r.createdAt)
                    )}
                  </p>
                </div>
                <button
                  disabled={busyId === r.id}
                  onClick={() => resolve(r.id)}
                  className="shrink-0 rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  {busyId === r.id ? "Memproses..." : "Tandai Selesai"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {done.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
            Riwayat Selesai ({done.length})
          </div>
          <div className="divide-y divide-slate-100">
            {done.map((r) => (
              <div key={r.id} className="px-4 py-3 text-sm">
                <p className="font-medium text-slate-800">
                  {r.userName} — &quot;{r.message}&quot;
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(
                    new Date(r.createdAt)
                  )}
                  {r.resolvedByName && ` · Diproses oleh ${r.resolvedByName}`}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
