"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { positionSchema, type PositionInput, type PositionOutput } from "@/lib/validation";

type Member = { id: string; name: string };
type Period = { id: string; name: string };

export function PositionForm({
  members,
  periods,
  positionId,
  initial,
  onSaved,
}: {
  members: Member[];
  periods: Period[];
  positionId?: string;
  initial?: Partial<PositionInput>;
  onSaved: () => void;
}) {
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PositionInput, unknown, PositionOutput>({
    resolver: zodResolver(positionSchema),
    defaultValues: { status: "AKTIF", order: 0, ...initial },
  });

  const onSubmit = async (data: PositionOutput) => {
    setFormError(null);
    setSubmitting(true);
    const res = await fetch(positionId ? `/api/positions/${positionId}` : "/api/positions", {
      method: positionId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setSubmitting(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setFormError(body.error || "Gagal menyimpan jabatan");
      return;
    }
    if (!positionId) reset({ title: "", userId: "", periodId: initial?.periodId, status: "AKTIF", order: 0 });
    onSaved();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <input
        type="text"
        placeholder="Nama Jabatan (mis. Ketua, Bendahara)"
        {...register("title")}
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
      />
      {errors.title && <p className="text-sm text-red-600">{errors.title.message}</p>}

      <select {...register("userId")} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
        <option value="">- Pilih Anggota -</option>
        {members.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
          </option>
        ))}
      </select>
      {errors.userId && <p className="text-sm text-red-600">{errors.userId.message}</p>}

      <select {...register("periodId")} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
        <option value="">- Pilih Periode -</option>
        {periods.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      {errors.periodId && <p className="text-sm text-red-600">{errors.periodId.message}</p>}

      <div className="grid grid-cols-2 gap-3">
        <select {...register("status")} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
          <option value="AKTIF">Aktif</option>
          <option value="NONAKTIF">Nonaktif</option>
        </select>
        <input
          type="number"
          placeholder="Urutan"
          {...register("order")}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      {formError && <p className="text-sm text-red-600">{formError}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
      >
        {submitting ? "Menyimpan..." : positionId ? "Simpan Perubahan" : "Tambah Jabatan"}
      </button>
    </form>
  );
}
