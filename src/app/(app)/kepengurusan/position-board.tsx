"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { PositionForm } from "./position-form";

type Member = { id: string; name: string };
type Period = { id: string; name: string };
type Row = {
  id: string;
  title: string;
  userId: string;
  userName: string;
  userPhoto: string | null;
  periodId: string;
  status: "AKTIF" | "NONAKTIF";
  order: number;
};

export function PositionBoard({
  positions,
  members,
  periods,
  activePeriodId,
  canManage,
}: {
  positions: Row[];
  members: Member[];
  periods: Period[];
  activePeriodId: string;
  canManage: boolean;
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const remove = async (id: string) => {
    if (!confirm("Hapus jabatan ini?")) return;
    setBusyId(id);
    const res = await fetch(`/api/positions/${id}`, { method: "DELETE" });
    setBusyId(null);
    if (res.ok) router.refresh();
  };

  return (
    <div className="space-y-6">
      {canManage && (
        <div>
          {showForm ? (
            <div className="rounded-lg border border-slate-200 bg-white p-6">
              <PositionForm
                members={members}
                periods={periods}
                initial={{ periodId: activePeriodId }}
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
              + Tambah Jabatan
            </button>
          )}
        </div>
      )}

      {positions.length === 0 ? (
        <p className="text-sm text-slate-500">Belum ada struktur kepengurusan untuk periode ini.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {positions.map((p) =>
            editingId === p.id ? (
              <div key={p.id} className="col-span-full rounded-lg border border-slate-200 bg-slate-50 p-4">
                <PositionForm
                  members={members}
                  periods={periods}
                  positionId={p.id}
                  initial={{
                    title: p.title,
                    userId: p.userId,
                    periodId: p.periodId,
                    status: p.status,
                    order: p.order,
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
                className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4"
              >
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-blue-100">
                  {p.userPhoto ? (
                    <Image src={p.userPhoto} alt={p.userName} fill className="object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-brand">
                      {p.userName.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-900">{p.title}</p>
                  <p className="truncate text-sm text-slate-500">{p.userName}</p>
                </div>
                {canManage && (
                  <div className="flex shrink-0 flex-col gap-1">
                    <button
                      onClick={() => setEditingId(p.id)}
                      className="rounded-md border border-slate-300 px-2 py-0.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Edit
                    </button>
                    <button
                      disabled={busyId === p.id}
                      onClick={() => remove(p.id)}
                      className="rounded-md border border-red-200 px-2 py-0.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      Hapus
                    </button>
                  </div>
                )}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
