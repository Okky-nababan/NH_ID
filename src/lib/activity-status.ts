import type { ActivityStatus } from "@/generated/prisma/enums";

/**
 * Status kegiatan ("Direncanakan"/"Berlangsung"/dst) disimpan manual di DB
 * dan tidak pernah diperbarui sendiri -- kalau Pengurus lupa mengubahnya,
 * kegiatan bisa tetap terlihat "Direncanakan" selamanya walau harinya
 * sudah tiba/lewat.
 *
 * Perbaikan: status yang DITAMPILKAN dihitung otomatis dari `date`
 * kegiatan, berlaku sama untuk kegiatan manual maupun kegiatan rutin
 * (isRoutine) -- keduanya cuma beda cara dibuat, bukan cara status
 * dihitung:
 *   - Tanggal kegiatan masih di masa depan -> "Direncanakan".
 *   - HARI ini (tanggal kalender kegiatan == hari ini) -> "Berlangsung",
 *     berapa pun jam kegiatannya -- begitu tanggalnya tiba, otomatis
 *     "Berlangsung" sepanjang hari itu.
 *   - Tanggal kegiatan sudah lewat hari ini -> "Selesai".
 * "Dibatalkan" dan "Selesai" yang sudah diset MANUAL tidak pernah
 * ditimpa -- keduanya tidak bisa diturunkan dari tanggal saja (kegiatan
 * batal atau selesai lebih awal dari jadwal tetap keputusan manusia).
 *
 * SENGAJA cuma status yang berubah -- kehadiran (Attendance) TETAP
 * dicatat manual oleh Pengurus/Admin lewat form "Input Kehadiran", tidak
 * ada yang diisi otomatis di sini.
 *
 * Catatan zona waktu: perbandingan "hari ini" pakai kalender lokal
 * proses yang menjalankan (sama seperti `date >= now` yang sudah dipakai
 * di halaman daftar kegiatan) -- bukan patokan UTC eksplisit seperti
 * `joinedAt` di sinkronisasi KAS, karena `Activity.date` memang disimpan
 * sebagai jam-tayang asli (bukan tanggal-saja) sejak awal dibuat lewat
 * form.
 */
function isSameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function getEffectiveActivityStatus(activity: {
  status: ActivityStatus;
  date: Date;
}): ActivityStatus {
  if (activity.status === "DIBATALKAN" || activity.status === "SELESAI") {
    return activity.status;
  }

  const now = new Date();
  if (isSameCalendarDay(activity.date, now)) return "BERLANGSUNG";
  return activity.date.getTime() > now.getTime() ? "DIRENCANAKAN" : "SELESAI";
}
