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
};

/**
 * Biodata anggota -- READ ONLY. Anggota tidak berhak mengedit langsung;
 * lihat edit-request-form.tsx untuk cara mengajukan perubahan ke
 * Admin/Pengurus. Pengecualian: password (change-password-form.tsx) dan
 * foto profil (photo-upload-form.tsx) -- keduanya boleh anggota ubah
 * sendiri tanpa persetujuan.
 */
export function ProfileInfo({ name, phone, address, birthPlace, birthDate, motherClan }: Props) {
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
      <p className="text-sm text-slate-500">
        Biodata di bawah dikelola oleh Admin/Pengurus. Kalau ada yang perlu diperbaiki, ajukan
        permintaan lewat form di bagian bawah halaman ini.
      </p>

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
