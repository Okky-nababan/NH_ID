"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import {
  transactionSchema,
  type TransactionInput,
  type TransactionOutput,
} from "@/lib/validation";

type Member = { id: string; name: string };
type Row = {
  id: string;
  type: "MASUK" | "KELUAR";
  category: string;
  amount: number;
  description: string;
  date: string;
  userName: string;
};

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function TransactionForm({ members, onSaved }: { members: Member[]; onSaved: () => void }) {
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TransactionInput, unknown, TransactionOutput>({
    resolver: zodResolver(transactionSchema),
    defaultValues: { type: "MASUK" },
  });

  const onSubmit = async (data: TransactionOutput) => {
    setFormError(null);
    setSubmitting(true);
    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setSubmitting(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setFormError(body.error || "Gagal menyimpan transaksi");
      return;
    }
    reset({ type: "MASUK", category: "", amount: undefined, description: "", date: "", userId: "" });
    onSaved();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <select {...register("type")} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
          <option value="MASUK">Pemasukan</option>
          <option value="KELUAR">Pengeluaran</option>
        </select>
        <input type="date" {...register("date")} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
      </div>
      <input
        type="text"
        placeholder="Kategori (Donasi, Konsumsi Acara, dll)"
        {...register("category")}
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
      />
      {errors.category && <p className="text-sm text-red-600">{errors.category.message}</p>}
      <input
        type="number"
        placeholder="Jumlah (Rp)"
        {...register("amount")}
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
      />
      {errors.amount && <p className="text-sm text-red-600">{errors.amount.message}</p>}
      <select {...register("userId")} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
        <option value="">- Tidak terkait anggota tertentu -</option>
        {members.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
          </option>
        ))}
      </select>
      <input
        type="text"
        placeholder="Keterangan (opsional)"
        {...register("description")}
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
      />
      {formError && <p className="text-sm text-red-600">{formError}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
      >
        {submitting ? "Menyimpan..." : "Tambah Transaksi"}
      </button>
    </form>
  );
}

export function TransactionSection({
  transactions,
  members,
  canManage,
}: {
  transactions: Row[];
  members: Member[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  const remove = async (id: string) => {
    if (!confirm("Hapus transaksi ini?")) return;
    setBusyId(id);
    const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    setBusyId(null);
    if (res.ok) router.refresh();
  };

  return (
    <div className="space-y-6">
      {canManage && (
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-slate-900">
            Tambah Transaksi Ledger Organisasi
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Untuk donasi, konsumsi acara, dan pengeluaran lain di luar iuran bulanan.
          </p>
          <div className="mt-4">
            <TransactionForm members={members} onSaved={() => router.refresh()} />
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-slate-600">Tanggal</th>
              <th className="px-4 py-2 text-left font-semibold text-slate-600">Kategori</th>
              <th className="px-4 py-2 text-left font-semibold text-slate-600">Keterangan</th>
              <th className="px-4 py-2 text-right font-semibold text-slate-600">Jumlah</th>
              {canManage && (
                <th className="px-4 py-2 text-left font-semibold text-slate-600">Aksi</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={canManage ? 5 : 4} className="px-4 py-6 text-center text-slate-500">
                  Belum ada transaksi.
                </td>
              </tr>
            ) : (
              transactions.map((t) => (
                <tr key={t.id}>
                  <td className="px-4 py-2 whitespace-nowrap text-slate-600">{t.date}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-slate-600">{t.category}</td>
                  <td className="px-4 py-2 text-slate-600">
                    {t.description || <span className="text-slate-300">-</span>}
                    {t.userName && <span className="text-xs text-slate-400"> · {t.userName}</span>}
                  </td>
                  <td
                    className={`px-4 py-2 text-right font-medium ${
                      t.type === "MASUK" ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {t.type === "MASUK" ? "+" : "-"}
                    {formatRupiah(t.amount)}
                  </td>
                  {canManage && (
                    <td className="px-4 py-2">
                      <button
                        disabled={busyId === t.id}
                        onClick={() => remove(t.id)}
                        className="rounded-md border border-red-200 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        Hapus
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
