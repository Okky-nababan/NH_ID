import { prisma } from "@/lib/prisma";

/**
 * Jadwal kegiatan rutin naposo-bulung: Selasa & Jumat, jangan sampai
 * ketinggalan walau pengurus lupa membuatnya manual di halaman Kegiatan.
 *
 * Jam ditulis dalam WIB (UTC+7, tanpa DST) lalu dikonversi ke UTC untuk
 * disimpan -- konsisten dengan pola Date.UTC(...) yang dipakai di seluruh
 * kode sinkron spreadsheet (lihat sheet-sync.ts, cash-payment-sync.ts).
 */
const ROUTINE_SCHEDULE = [
  {
    // getUTCDay(): 0=Minggu .. 6=Sabtu
    weekday: 2, // Selasa
    name: "Persekutuan Rutin Selasa",
    hourWIB: 19,
  },
  {
    weekday: 5, // Jumat
    name: "Persekutuan Rutin Jumat",
    hourWIB: 19,
  },
] as const;

const ROUTINE_DESCRIPTION =
  "Persekutuan rutin naposo-bulung Immanuel Dumai. Jadwal ini dibuat otomatis agar kegiatan rutin Selasa & Jumat selalu tercatat dan bisa langsung diisi kehadirannya oleh pengurus/admin. Detail (waktu, lokasi, penanggung jawab) bisa disesuaikan lewat tombol Edit.";

const DEFAULT_LOCATION = "Gedung Gereja HKBP Immanuel Dumai";

function wibHourToUtc(dayUtcMidnight: Date, hourWIB: number): Date {
  const date = new Date(dayUtcMidnight);
  date.setUTCHours(hourWIB - 7, 0, 0, 0);
  return date;
}

/**
 * Cari user ADMIN aktif untuk dipakai sebagai `createdById` saat generator
 * dipicu dari cron (tidak ada sesi login). Activity.createdById wajib diisi
 * (relasi non-nullable), jadi tidak bisa null.
 */
async function resolveSystemCreatorId(): Promise<string | null> {
  const admin = await prisma.user.findFirst({
    where: { role: "ADMIN", isActive: true },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  return admin?.id ?? null;
}

/**
 * Pastikan setiap Selasa & Jumat dalam rentang `daysAhead` hari ke depan
 * (dari hari ini) sudah punya kegiatan rutin di database. Idempotent --
 * tanggal yang sudah punya kegiatan `isRoutine: true` dilewati, tidak
 * dibuat dobel. Aman dipanggil berkali-kali (manual maupun cron harian).
 */
export async function ensureRoutineActivities({
  createdById,
  daysAhead = 60,
}: {
  createdById?: string;
  daysAhead?: number;
} = {}): Promise<{ created: number; createdDates: string[]; skippedNoCreator: boolean }> {
  const actorId = createdById ?? (await resolveSystemCreatorId());
  if (!actorId) {
    return { created: 0, createdDates: [], skippedNoCreator: true };
  }

  const todayUtcMidnight = new Date();
  todayUtcMidnight.setUTCHours(0, 0, 0, 0);

  const createdDates: string[] = [];

  for (let i = 0; i < daysAhead; i++) {
    const day = new Date(todayUtcMidnight);
    day.setUTCDate(day.getUTCDate() + i);
    const weekday = day.getUTCDay();

    const schedule = ROUTINE_SCHEDULE.find((s) => s.weekday === weekday);
    if (!schedule) continue;

    const dayEnd = new Date(day);
    dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

    const existing = await prisma.activity.findFirst({
      where: { isRoutine: true, date: { gte: day, lt: dayEnd } },
      select: { id: true },
    });
    if (existing) continue;

    const activity = await prisma.activity.create({
      data: {
        name: schedule.name,
        type: "PERSEKUTUAN",
        description: ROUTINE_DESCRIPTION,
        date: wibHourToUtc(day, schedule.hourWIB),
        location: DEFAULT_LOCATION,
        status: "DIRENCANAKAN",
        isRoutine: true,
        createdById: actorId,
      },
    });
    createdDates.push(
      new Intl.DateTimeFormat("id-ID", { dateStyle: "full", timeZone: "UTC" }).format(activity.date)
    );
  }

  return { created: createdDates.length, createdDates, skippedNoCreator: false };
}
