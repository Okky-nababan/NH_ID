import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-4 text-center">
      <p className="text-sm font-bold uppercase tracking-widest text-brand">404</p>
      <h1 className="text-2xl font-bold text-slate-900">Halaman tidak ditemukan</h1>
      <p className="max-w-sm text-sm text-slate-500">
        Halaman yang Anda cari tidak ada atau sudah dipindahkan.
      </p>
      <Link
        href="/dashboard"
        className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
      >
        Kembali ke Dashboard
      </Link>
    </div>
  );
}
