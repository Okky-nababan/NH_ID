import type { ActivityStatus } from "@/generated/prisma/enums";

/**
 * Status kegiatan ("Direncanakan"/"Berlangsung"/dst) disimpan manual di DB
 * dan tidak pernah diperbarui sendiri -- kalau Pengurus lupa mengubahnya
 * setelah kegiatan lewat, kegiatan bulan lalu bisa tetap terlihat
 * "Direncanakan"/"Berlangsung" selamanya di halaman Kegiatan.
 *
 * Perbaikan: status yang DITAMPILKAN dihitung ulang saat kegiatan sudah
 * lewat tanggalnya -- kalau status tersimpan masih DIRENCANAKAN atau
 * BERLANGSUNG padahal `date` sudah lewat, ditampilkan sebagai SELESAI.
 * SELESAI dan DIBATALKAN yang sudah diset manual TIDAK pernah ditimpa.
 *
 * SENGAJA hanya status yang berubah -- kehadiran (Attendance) TETAP
 * dicatat manual oleh Pengurus/Admin lewat form "Input Kehadiran", tidak
 * ada yang diisi otomatis di sini.
 */
export function getEffectiveActivityStatus(activity: {
  status: ActivityStatus;
  date: Date;
}): ActivityStatus {
  const isStillOpen = activity.status === "DIRENCANAKAN" || activity.status === "BERLANGSUNG";
  const hasPassed = activity.date.getTime() < Date.now();
  return isStillOpen && hasPassed ? "SELESAI" : activity.status;
}
