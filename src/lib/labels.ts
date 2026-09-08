export const ACTIVITY_TYPE_LABELS: Record<string, string> = {
  IBADAH: "Ibadah",
  KEBAKTIAN: "Kebaktian",
  PERSEKUTUAN: "Persekutuan",
  RAPAT: "Rapat",
  OLAHRAGA: "Olahraga",
  BAKTI_SOSIAL: "Bakti Sosial",
  ACARA_GEREJA: "Acara Gereja",
  RETREAT: "Retreat",
  PELAYANAN: "Pelayanan",
  KEGIATAN_SOSIAL: "Kegiatan Sosial",
  LAINNYA: "Lainnya",
};

export const ACTIVITY_STATUS_LABELS: Record<string, string> = {
  DIRENCANAKAN: "Direncanakan",
  BERLANGSUNG: "Berlangsung",
  SELESAI: "Selesai",
  DIBATALKAN: "Dibatalkan",
};

export const ACTIVITY_STATUS_CLASS: Record<string, string> = {
  DIRENCANAKAN: "bg-blue-50 text-blue-700",
  BERLANGSUNG: "bg-amber-50 text-amber-700",
  SELESAI: "bg-green-50 text-green-700",
  DIBATALKAN: "bg-red-50 text-red-700",
};

export const ATTENDANCE_STATUS_LABELS: Record<string, string> = {
  HADIR: "Hadir",
  TIDAK_HADIR: "Tidak Hadir",
  IZIN: "Izin",
  SAKIT: "Sakit",
};

export const ATTENDANCE_STATUS_CLASS: Record<string, string> = {
  HADIR: "bg-green-50 text-green-700",
  TIDAK_HADIR: "bg-red-50 text-red-700",
  IZIN: "bg-amber-50 text-amber-700",
  SAKIT: "bg-purple-50 text-purple-700",
};

export const CASH_STATUS_LABELS: Record<string, string> = {
  BELUM_BAYAR: "Belum Bayar",
  LUNAS: "Lunas",
  PENDING: "Pending",
  DIBATALKAN: "Dibatalkan",
};

export const CASH_STATUS_CLASS: Record<string, string> = {
  BELUM_BAYAR: "bg-slate-100 text-slate-600",
  LUNAS: "bg-green-50 text-green-700",
  PENDING: "bg-amber-50 text-amber-700",
  DIBATALKAN: "bg-red-50 text-red-700",
};

export const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  PENGURUS: "Pengurus",
  ANGGOTA: "Anggota",
};
