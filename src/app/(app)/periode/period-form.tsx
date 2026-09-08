"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  managementPeriodSchema,
  type ManagementPeriodInput,
  type ManagementPeriodOutput,
} from "@/lib/validation";

export function PeriodForm({
  periodId,
  initial,
  onSaved,
}: {
  periodId?: string;
  initial?: Partial<ManagementPeriodInput>;
  onSaved: () => void;
}) {
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ManagementPeriodInput, unknown, ManagementPeriodOutput>({
    resolver: zodResolver(managementPeriodSchema),
    defaultValues: { isActive: false, ...initial },
  });

  const onSubmit = async (data: ManagementPeriodOutput) => {
    setFormError(null);
    setSubmitting(true);
    const res = await fetch(periodId ? `/api/periods/${periodId}` : "/api/periods", {
      method: periodId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setSubmitting(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setFormError(body.error || "Gagal menyimpan periode");
      return;
    }
    if (!periodId) reset({ name: "", startYear: undefined, endYear: undefined, isActive: false, notes: "" });
    onSaved();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <input
        type="text"
        placeholder="Nama periode (mis. Periode 2025-2027)"
        {...register("name")}
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
      />
      {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}

      <div className="grid grid-cols-2 gap-3">
        <input
          type="number"
          placeholder="Tahun Mulai"
          {...register("startYear")}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          type="number"
          placeholder="Tahun Selesai"
          {...register("endYear")}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" {...register("isActive")} className="h-4 w-4 rounded border-slate-300" />
        Jadikan periode aktif (periode aktif lain otomatis dinonaktifkan)
      </label>

      <textarea
        rows={2}
        placeholder="Keterangan (opsional)"
        {...register("notes")}
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
      />

      {formError && <p className="text-sm text-red-600">{formError}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
      >
        {submitting ? "Menyimpan..." : periodId ? "Simpan Perubahan" : "Tambah Periode"}
      </button>
    </form>
  );
}
