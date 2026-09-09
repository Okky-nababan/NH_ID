import Image from "next/image";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "long", timeZone: "UTC" }).format(date);
}

type Props = {
  name: string;
  phone: string;
  address: string;
  birthPlace: string;
  birthDate: Date | null;
  motherClan: string;
  photoUrl: string;
};

/**
 * Biodata anggota -- READ ONLY. Anggota tidak berhak mengedit langsung;
 * lihat edit-request-form.tsx untuk cara mengajukan perubahan ke
 * Admin/Pengurus, dan change-password-form.tsx untuk satu-satunya hal
 * yang boleh anggota ubah sendiri (password).
 */
export function ProfileInfo({ name, phone, address, birthPlace, birthDate, motherClan, photoUrl }: Props) {
  const rows: { label: string; value: string }[] = [
    { label: "Nama Lengkap", value: name },
    { label: "Nomor HP", value: phone },
    { label: "Alamat", value: address || "-" },
    {
      label: "Tempat, Tanggal Lahir",
      value: birthPlace || birthDate ? `${birthPlace || "-"}${birthDate ? `, ${formatDate(birthDate)}` : ""}` : "-",
    },
    { label: "Tubu/Boru ni Mama (Marga Ibu)", value: motherClan || "-" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-blue-100">
          {photoUrl ? (
            <Image src={photoUrl} alt="Foto profil" fill className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-blue-700">
              {name.slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>
        <p className="text-sm text-slate-500">
          Biodata di bawah dikelola oleh Admin/Pengurus. Kalau ada yang perlu diperbaiki
          (termasuk foto profil), ajukan permintaan lewat form di bagian bawah halaman ini.
        </p>
      </div>

      <dl className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between px-4 py-3 text-sm">
            <dt className="text-slate-500">{r.label}</dt>
            <dd className="font-medium text-slate-900">{r.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
