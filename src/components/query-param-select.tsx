"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

type Option = { value: string; label: string };

/**
 * Select yang otomatis navigasi (update query param URL) saat dipilih.
 * Server Component tidak boleh punya onChange langsung di elemen native —
 * ini menggantikan pola lama `<select onChange={(e) => form.submit()}>`
 * yang crash karena event handler tidak bisa dikirim dari Server Component.
 */
export function QueryParamSelect({
  paramName,
  options,
  className,
  fallback = "",
}: {
  paramName: string;
  options: Option[];
  className?: string;
  /** Nilai yang ditampilkan saat param belum ada di URL (mis. default dari server). */
  fallback?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get(paramName) ?? fallback;

  return (
    <select
      value={current}
      onChange={(e) => {
        const params = new URLSearchParams(searchParams.toString());
        if (e.target.value) {
          params.set(paramName, e.target.value);
        } else {
          params.delete(paramName);
        }
        router.push(`${pathname}?${params.toString()}`);
      }}
      className={className}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
