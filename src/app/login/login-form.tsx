"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { loginSchema, type LoginInput } from "@/lib/validation";
import { Logo } from "@/components/logo";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // Password ditampilkan apa adanya (tidak disamarkan) sesuai permintaan —
  // tombol mata tetap disediakan kalau user ingin menyembunyikannya sendiri.
  const [showPassword, setShowPassword] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginInput) => {
    setFormError(null);
    setSubmitting(true);
    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });
    setSubmitting(false);

    if (result?.error) {
      setFormError("Email atau password salah, atau akun tidak aktif.");
      return;
    }

    const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
    router.push(callbackUrl);
    router.refresh();
  };

  return (
    <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
      <div className="flex flex-col items-center text-center">
        <Logo size={56} />
        <h1 className="mt-4 text-xl font-bold text-slate-900">Masuk</h1>
        <p className="mt-1 text-sm text-slate-500">
          Naposo-Bulung Immanuel Dumai
        </p>
      </div>

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
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-slate-700">
              Password
            </label>
            <Link href="/lupa-password" className="text-xs font-medium text-brand hover:underline">
              Lupa password?
            </Link>
          </div>
          <div className="relative mt-1">
            <input
              type={showPassword ? "text" : "password"}
              {...register("password")}
              className="w-full rounded-md border border-slate-300 px-3 py-2 pr-10 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              tabIndex={-1}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-xs font-medium text-slate-500 hover:text-slate-700"
            >
              {showPassword ? "Sembunyikan" : "Tampilkan"}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
          )}
        </div>

        {formError && <p className="text-sm text-red-600">{formError}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
        >
          {submitting ? "Memproses..." : "Masuk"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Belum punya akun?{" "}
        <Link href="/register" className="font-medium text-brand hover:underline">
          Daftar di sini
        </Link>
      </p>
    </div>
  );
}
