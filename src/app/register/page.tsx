"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { registerSchema, type RegisterInput } from "@/lib/validation";
import { Logo } from "@/components/logo";

export default function RegisterPage() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (data: RegisterInput) => {
    setFormError(null);
    setSubmitting(true);

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setFormError(body.error || "Gagal mendaftar. Coba lagi.");
      setSubmitting(false);
      return;
    }

    const signInResult = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });
    setSubmitting(false);

    if (signInResult?.error) {
      router.push("/login");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="flex flex-1 items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col items-center text-center">
          <Logo size={56} />
          <h1 className="mt-4 text-xl font-bold text-slate-900">Daftar Anggota</h1>
          <p className="mt-1 text-sm text-slate-500">
            Naposo-Bulung Immanuel Dumai
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Nama Lengkap
            </label>
            <input
              type="text"
              {...register("name")}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

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
              Nomor HP
            </label>
            <input
              type="tel"
              {...register("phone")}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              type="password"
              {...register("password")}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Jenis Kelamin
              </label>
              <select
                {...register("gender")}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              >
                <option value="">- Pilih -</option>
                <option value="LAKI_LAKI">Laki-laki</option>
                <option value="PEREMPUAN">Perempuan</option>
              </select>
              {errors.gender && (
                <p className="mt-1 text-sm text-red-600">{errors.gender.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Tanggal Lahir
              </label>
              <input
                type="date"
                {...register("birthDate")}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              />
              {errors.birthDate && (
                <p className="mt-1 text-sm text-red-600">{errors.birthDate.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Tempat Lahir
            </label>
            <input
              type="text"
              {...register("birthPlace")}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
            {errors.birthPlace && (
              <p className="mt-1 text-sm text-red-600">{errors.birthPlace.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Alamat
            </label>
            <input
              type="text"
              {...register("address")}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
            {errors.address && (
              <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Tubu/Boru ni Mama (Marga Ibu) — opsional
            </label>
            <input
              type="text"
              placeholder="Mis. Boru Sihombing"
              {...register("motherClan")}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>

          {formError && <p className="text-sm text-red-600">{formError}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
          >
            {submitting ? "Memproses..." : "Daftar"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Sudah punya akun?{" "}
          <Link href="/login" className="font-medium text-brand hover:underline">
            Masuk di sini
          </Link>
        </p>
      </div>
    </div>
  );
}
