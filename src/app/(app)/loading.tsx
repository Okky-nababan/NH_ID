export default function AppLoading() {
  return (
    <div className="flex flex-1 items-center justify-center py-24">
      <div className="flex flex-col items-center gap-3">
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-brand"
          role="status"
          aria-label="Memuat"
        />
        <p className="text-sm text-slate-500">Memuat...</p>
      </div>
    </div>
  );
}
