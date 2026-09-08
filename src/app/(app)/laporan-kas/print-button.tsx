"use client";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 print:hidden"
    >
      Cetak / Simpan sebagai PDF
    </button>
  );
}
