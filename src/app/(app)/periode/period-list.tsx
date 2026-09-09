"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PeriodForm } from "./period-form";

type Row = {
  id: string;
  name: string;
  startYear: number;
  endYear: number;
  isActive: boolean;
  notes: string;
  positionCount: number;
};

export function PeriodList({ periods, canManage }: { periods: Row[]; canManage: boolean }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const remove = async (period: Row) => {
    // Menghapus periode ikut menghapus SEMUA data jabatan/kepengurusan yang
    // terhubung ke periode ini (relasi cascade) -- peringatkan jumlahnya
    // secara eksplisit supaya tidak ada yang terhapus tanpa sadar.
    const message =
      period.positionCount > 0
        ? `Periode "${period.name}" ini punya ${period.positionCount} data jabatan/kepengurusan. Menghapus periode akan ikut MENGHAPUS PERMANEN seluruh ${period.positionCount} data jabatan tersebut. Lanjutkan?`
        : `Hapus periode "${period.name}"? Periode ini belum punya data jabatan terhubung.`;
    if (!confirm(message)) return;
    setBusyId(period.id);
    const res = await fetch(`/api/periods/${period.id}`, { method: "DELETE" });
    setBusyId(null);
    if (res.ok) router.refresh();
  };

  return (
    <div className="space-y-6">
      {canManage && (
        <div>
          {showForm ? (
            <div className="rounded-lg border border-slate-200 bg-white p-6">
              <PeriodForm
                onSaved={() => {
                  setShowForm(false);
                  router.refresh();
                }}
              />
              <button
                onClick={() => setShowForm(false)}
                className="mt-3 text-sm text-slate-500 hover:underline"
              >
                Batal
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowForm(true)}
              className="rounded-md bg-brand px-3 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
            >
              + Tambah Periode
            </button>
          )}
        </div>
      )}

      <div className="space-y-3">
        {periods.map((p) =>
          editingId === p.id ? (
            <div key={p.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <PeriodForm
                periodId={p.id}
                initial={{
                  name: p.name,
                  startYear: p.startYear,
                  endYear: p.endYear,
                  isActive: p.isActive,
                  notes: p.notes,
                }}
                onSaved={() => {
                  setEditingId(null);
                  router.refresh();
                }}
              />
              <button
                onClick={() => setEditingId(null)}
                className="mt-3 text-sm text-slate-500 hover:underline"
              >
                Batal
              </button>
            </div>
          ) : (
            <div
              key={p.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4"
            >
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-slate-900">{p.name}</p>
                  {p.isActive && (
                    <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700">
                      Aktif
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-500">
                  {p.startYear} - {p.endYear} &middot; {p.positionCount} jabatan
                </p>
                {p.notes && <p className="mt-1 text-sm text-slate-500">{p.notes}</p>}
              </div>
              {canManage && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingId(p.id)}
                    className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Edit
                  </button>
                  <button
                    disabled={busyId === p.id}
                    onClick={() => remove(p)}
                    className="rounded-md border border-red-200 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    Hapus
                  </button>
                </div>
              )}
            </div>
          )
        )}
      </div>
    </div>
  );
}
