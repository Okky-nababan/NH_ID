"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CashPaymentForm } from "./cash-payment-form";
import { CASH_STATUS_LABELS, CASH_STATUS_CLASS } from "@/lib/labels";
import { MONTH_NAMES_ID } from "@/lib/constants";

type Member = { id: string; name: string };
type Row = {
  id: string;
  userId: string;
  userName: string;
  month: number;
  year: number;
  amount: number;
  status: "BELUM_BAYAR" | "LUNAS" | "PENDING" | "DIBATALKAN";
  method: "CASH" | "TRANSFER" | "LAINNYA" | null;
  notes: string;
  paymentDate: string;
};

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function CashPaymentList({
  payments,
  members,
  canManage,
}: {
  payments: Row[];
  members: Member[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const remove = async (id: string) => {
    if (!confirm("Hapus catatan pembayaran ini?")) return;
    setBusyId(id);
    const res = await fetch(`/api/cash-payments/${id}`, { method: "DELETE" });
    setBusyId(null);
    if (res.ok) router.refresh();
  };

  return (
    <div className="space-y-6">
      {canManage && (
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-slate-900">Catat Pembayaran Kas</h2>
          <div className="mt-4">
            <CashPaymentForm members={members} onSaved={() => router.refresh()} />
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-slate-600">Anggota</th>
              <th className="px-4 py-2 text-left font-semibold text-slate-600">Periode</th>
              <th className="px-4 py-2 text-right font-semibold text-slate-600">Nominal</th>
              <th className="px-4 py-2 text-left font-semibold text-slate-600">Status</th>
              {canManage && (
                <th className="px-4 py-2 text-left font-semibold text-slate-600">Aksi</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {payments.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                  Belum ada catatan pembayaran.
                </td>
              </tr>
            ) : (
              payments.map((p) =>
                editingId === p.id ? (
                  <tr key={p.id}>
                    <td colSpan={5} className="bg-slate-50 px-4 py-4">
                      <CashPaymentForm
                        members={members}
                        paymentId={p.id}
                        initial={{
                          userId: p.userId,
                          month: p.month,
                          year: p.year,
                          amount: p.amount,
                          status: p.status,
                          method: p.method ?? "CASH",
                          notes: p.notes,
                          paymentDate: p.paymentDate,
                        }}
                        onSaved={() => setEditingId(null)}
                      />
                      <button
                        onClick={() => setEditingId(null)}
                        className="mt-3 text-sm text-slate-500 hover:underline"
                      >
                        Batal
                      </button>
                    </td>
                  </tr>
                ) : (
                  <tr key={p.id}>
                    <td className="px-4 py-2 font-medium text-slate-900">{p.userName}</td>
                    <td className="px-4 py-2 text-slate-600">
                      {MONTH_NAMES_ID[p.month - 1]} {p.year}
                    </td>
                    <td className="px-4 py-2 text-right text-slate-700">
                      {formatRupiah(p.amount)}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`rounded px-1.5 py-0.5 text-xs font-medium ${CASH_STATUS_CLASS[p.status]}`}
                      >
                        {CASH_STATUS_LABELS[p.status]}
                      </span>
                    </td>
                    {canManage && (
                      <td className="px-4 py-2">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingId(p.id)}
                            className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                          >
                            Edit
                          </button>
                          <button
                            disabled={busyId === p.id}
                            onClick={() => remove(p.id)}
                            className="rounded-md border border-red-200 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                          >
                            Hapus
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                )
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
