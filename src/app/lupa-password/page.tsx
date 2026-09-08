"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { passwordResetRequestSchema, type PasswordResetRequestInput } from "@/lib/validation";
import { Logo } from "@/components/logo";

export default function LupaPasswordPage() {
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PasswordResetRequestInput>({ resolver: zodResolver(passwordResetRequestSchema) });

  const onSubmit = async (data: PasswordResetRequestInput) => {
    setFormError(null);
    setSubmitting(true);
    const res = await fetch("/api/password-reset-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setSubmitting(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setFormError(body.error || "Gagal mengirim permintaan. Coba lagi.");
      return;
    }

    setSent(true);
  };

  return (
    <div className="flex flex-1 items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col items-center text-center">
          <Logo size={56} />
          <h1 className="mt-4 text-xl font-bold text-slate-900">Lupa Password</h1>
          <p className="mt-1 text-sm text-slate-500">
            Naposo-Bulung Immanuel Dumai
          </p>
        </div>

        {sent ? (
          <div className="mt-6 rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-800">
            <p className="font-medium">Permintaan terkirim.</p>
            <p className="mt-1">
              Admin akan memproses permintaan reset password Anda secara manual dan
              menghubungi Anda lewat kontak yang terdaftar. Proses ini tidak instan
              karena belum ada pengiriman email otomatis.
            </p>
          </div>
        ) : (
          <>
            <p className="mt-4 text-sm text-slate-500">
              Isi email akun Anda. Permintaan akan diteruskan ke Admin untuk
              di-reset secara manual (belum ada pengiriman email otomatis).
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Email
                </label>
                <input
                  type="email"
                  {...register("email")}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Catatan (opsional)
                </label>
                <textarea
                  rows={3}
                  {...register("message")}
                  placeholder="Mis. nomor HP aktif supaya Admin mudah menghubungi Anda"
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                />
                {errors.message && (
                  <p className="mt-1 text-sm text-red-600">{errors.message.message}</p>
                )}
              </div>

              {formError && <p className="text-sm text-red-600">{formError}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
              >
                {submitting ? "Mengirim..." : "Kirim Permintaan"}
              </button>
            </form>
          </>
        )}

        <p className="mt-6 text-center text-sm text-slate-500">
          <Link href="/login" className="font-medium text-brand hover:underline">
            Kembali ke halaman Masuk
          </Link>
        </p>
      </div>
    </div>
  );
}
