"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { profileEditRequestSchema, type ProfileEditRequestInput } from "@/lib/validation";

type PastRequest = {
  id: string;
  message: string;
  status: "PENDING" | "DONE";
  createdAt: string;
};

export function EditRequestForm({ pastRequests }: { pastRequests: PastRequest[] }) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileEditRequestInput>({ resolver: zodResolver(profileEditRequestSchema) });

  const onSubmit = async (data: ProfileEditRequestInput) => {
    setFormError(null);
    setSuccess(false);
    setSubmitting(true);

    const res = await fetch("/api/profile-edit-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setSubmitting(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setFormError(body.error || "Gagal mengirim permintaan");
      return;
    }

    setSuccess(true);
    reset();
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">
        Biodata (nama, alamat, tanggal lahir, dll) hanya bisa diubah oleh Admin/Pengurus.
        Kalau ada yang perlu diperbaiki, jelaskan di sini dan Admin/Pengurus akan menghubungi
        Anda untuk memprosesnya.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <textarea
          rows={3}
          placeholder="Mis. Alamat saya sudah pindah ke ..., tolong diperbarui."
          {...register("message")}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        {errors.message && <p className="text-sm text-red-600">{errors.message.message}</p>}

        {formError && <p className="text-sm text-red-600">{formError}</p>}
        {success && (
          <p className="text-sm text-green-600">
            Permintaan terkirim. Admin/Pengurus akan memprosesnya.
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="rounded-md border border-brand px-4 py-2 text-sm font-semibold text-brand hover:bg-blue-50 disabled:opacity-60"
        >
          {submitting ? "Mengirim..." : "Kirim Permintaan"}
        </button>
      </form>

      {pastRequests.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-semibold text-slate-500">Riwayat permintaan Anda</p>
          <div className="mt-2 divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
            {pastRequests.map((r) => (
              <div key={r.id} className="px-4 py-3 text-sm">
                <div className="flex items-center justify-between">
                  <p className="text-slate-700">{r.message}</p>
                  <span
                    className={`ml-3 shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
                      r.status === "DONE"
                        ? "bg-green-50 text-green-700"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {r.status === "DONE" ? "Selesai" : "Menunggu"}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  {new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(
                    new Date(r.createdAt)
                  )}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
