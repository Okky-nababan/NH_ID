"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Row = {
  id: string;
  email: string;
  message: string;
  status: "PENDING" | "DONE";
  createdAt: string;
  resolvedByName: string;
};

export function PasswordResetTable({ requests }: { requests: Row[] }) {
  const router = useRouter();
  const [openId, setOpenId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pending = requests.filter((r) => r.status === "PENDING");
  const done = requests.filter((r) => r.status === "DONE");

  const resolve = async (id: string, body: object) => {
    setBusyId(id);
    setError(null);
    const res = await fetch(`/api/password-reset-requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusyId(null);
    if (!res.ok) {
      const responseBody = await res.json().catch(() => ({}));
      setError(responseBody.error || "Gagal memproses permintaan");
      return;
    }
    setOpenId(null);
    setNewPassword("");
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
              <div key={r.id} className="px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{r.email}</p>
                    <p className="text-xs text-slate-400">
                      {new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(
                        new Date(r.createdAt)
                      )}
                    </p>
                    {r.message && (
                      <p className="mt-1 text-sm text-slate-600">&quot;{r.message}&quot;</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setOpenId(openId === r.id ? null : r.id)}
                      className="rounded-md border border-brand px-3 py-1.5 text-xs font-semibold text-brand hover:bg-blue-50"
                    >
                      Set Password Baru
                    </button>
                    <button
                      disabled={busyId === r.id}
                      onClick={() => resolve(r.id, { action: "dismiss" })}
                      className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                    >
                      Tandai Selesai
                    </button>
                  </div>
                </div>

                {openId === r.id && (
                  <div className="mt-3 flex flex-wrap items-center gap-2 rounded-md bg-slate-50 p-3">
                    <input
                      type="text"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Password baru (minimal 8 karakter)"
                      className="min-w-[220px] flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                    />
                    <button
                      disabled={busyId === r.id || newPassword.length < 8}
                      onClick={() => resolve(r.id, { newPassword })}
                      className="rounded-md bg-brand px-3 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
                    >
                      {busyId === r.id ? "Memproses..." : "Simpan & Reset"}
                    </button>
                  </div>
                )}
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
                <p className="font-medium text-slate-800">{r.email}</p>
                <p className="text-xs text-slate-400">
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
