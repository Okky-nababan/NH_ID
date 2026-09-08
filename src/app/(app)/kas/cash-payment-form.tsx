"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import {
  cashPaymentSchema,
  type CashPaymentInput,
  type CashPaymentOutput,
} from "@/lib/validation";
import { MONTH_NAMES_ID, MONTHLY_DUES } from "@/lib/constants";
import { CASH_STATUS_LABELS } from "@/lib/labels";

type Member = { id: string; name: string };

export function CashPaymentForm({
  members,
  paymentId,
  initial,
  onSaved,
}: {
  members: Member[];
  paymentId?: string;
  initial?: Partial<CashPaymentInput>;
  onSaved?: () => void;
}) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const now = new Date();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CashPaymentInput, unknown, CashPaymentOutput>({
    resolver: zodResolver(cashPaymentSchema),
    defaultValues: {
      status: "LUNAS",
      amount: MONTHLY_DUES,
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      method: "CASH",
      ...initial,
    },
  });

  const onSubmit = async (data: CashPaymentOutput) => {
    setFormError(null);
    setSubmitting(true);

    const res = await fetch(paymentId ? `/api/cash-payments/${paymentId}` : "/api/cash-payments", {
      method: paymentId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setSubmitting(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setFormError(body.error || "Gagal menyimpan pembayaran kas");
      return;
    }

    if (!paymentId) {
      reset({
        status: "LUNAS",
        amount: MONTHLY_DUES,
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        method: "CASH",
        userId: "",
        notes: "",
      });
    }
    router.refresh();
    onSaved?.();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700">Anggota</label>
        <select
          {...register("userId")}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">- Pilih Anggota -</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        {errors.userId && <p className="mt-1 text-sm text-red-600">{errors.userId.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">Bulan</label>
          <select
            {...register("month")}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            {MONTH_NAMES_ID.map((label, idx) => (
              <option key={label} value={idx + 1}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Tahun</label>
          <input
            type="number"
            {...register("year")}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">Nominal (Rp)</label>
          <input
            type="number"
            {...register("amount")}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          {errors.amount && <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Tanggal Bayar</label>
          <input
            type="date"
            {...register("paymentDate")}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">Status</label>
          <select
            {...register("status")}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            {Object.entries(CASH_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Metode</label>
          <select
            {...register("method")}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="CASH">Cash</option>
            <option value="TRANSFER">Transfer</option>
            <option value="LAINNYA">Lainnya</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Catatan</label>
        <input
          type="text"
          {...register("notes")}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      {formError && <p className="text-sm text-red-600">{formError}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
      >
        {submitting ? "Menyimpan..." : paymentId ? "Simpan Perubahan" : "Catat Pembayaran"}
      </button>
    </form>
  );
}
