"use client";

import { useEffect } from "react";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-24 text-center">
      <div>
        <h1 className="text-lg font-bold text-slate-900">Terjadi kesalahan</h1>
        <p className="mt-2 max-w-sm text-sm text-slate-500">
          Halaman gagal dimuat. Silakan coba lagi, atau hubungi pengurus jika masalah berlanjut.
        </p>
      </div>
      <div className="flex gap-3">
        <button
          onClick={() => reset()}
          className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          Coba Lagi
        </button>
        <a
          href="/dashboard"
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Ke Dashboard
        </a>
      </div>
    </div>
  );
}
