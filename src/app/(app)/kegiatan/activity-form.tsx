"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { activitySchema, type ActivityInput } from "@/lib/validation";
import { ACTIVITY_TYPE_LABELS, ACTIVITY_STATUS_LABELS } from "@/lib/labels";

type Member = { id: string; name: string };

type Props = {
  activityId?: string;
  initial?: Partial<ActivityInput>;
  members: Member[];
};

export function ActivityForm({ activityId, initial, members }: Props) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ActivityInput>({
    resolver: zodResolver(activitySchema),
    defaultValues: { type: "IBADAH", status: "DIRENCANAKAN", ...initial },
  });

  const onSubmit = async (data: ActivityInput) => {
    setFormError(null);
    setSubmitting(true);

    const res = await fetch(activityId ? `/api/activities/${activityId}` : "/api/activities", {
      method: activityId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setSubmitting(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setFormError(body.error || "Gagal menyimpan kegiatan");
      return;
    }

    const { activity } = await res.json();
    router.push(`/kegiatan/${activity.id}`);
    router.refresh();
  };

  const onDelete = async () => {
    if (!activityId) return;
    if (!confirm("Hapus kegiatan ini beserta seluruh catatan kehadirannya? Tindakan ini tidak bisa dibatalkan."))
      return;
    setFormError(null);
    setDeleting(true);
    const res = await fetch(`/api/activities/${activityId}`, { method: "DELETE" });
    setDeleting(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setFormError(body.error || "Gagal menghapus kegiatan");
      return;
    }
    router.push("/kegiatan");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700">Nama Kegiatan</label>
        <input
          type="text"
          {...register("name")}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Deskripsi</label>
        <textarea
          rows={3}
          {...register("description")}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">Jenis Kegiatan</label>
          <select
            {...register("type")}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            {Object.entries(ACTIVITY_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Status</label>
          <select
            {...register("status")}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            {Object.entries(ACTIVITY_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">Tanggal &amp; Waktu</label>
          <input
            type="datetime-local"
            {...register("date")}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          {errors.date && <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Lokasi</label>
          <input
            type="text"
            {...register("location")}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          {errors.location && (
            <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Penanggung Jawab</label>
        <select
          {...register("personInChargeId")}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">- Tidak ditentukan -</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Catatan</label>
        <textarea
          rows={2}
          {...register("notes")}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      {formError && <p className="text-sm text-red-600">{formError}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
        >
          {submitting ? "Menyimpan..." : activityId ? "Simpan Perubahan" : "Buat Kegiatan"}
        </button>
        {activityId && (
          <button
            type="button"
            disabled={deleting}
            onClick={onDelete}
            className="rounded-md border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
          >
            {deleting ? "Menghapus..." : "Hapus Kegiatan"}
          </button>
        )}
      </div>
    </form>
  );
}
