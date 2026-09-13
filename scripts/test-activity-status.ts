import { getEffectiveActivityStatus } from "../src/lib/activity-status";

const now = new Date();
const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

function daysFromToday(days: number, hour = 10): Date {
  const d = new Date(startOfToday);
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  return d;
}

type Case = { status: string; date: Date; expect: string; note: string };

const cases: Case[] = [
  { status: "DIRENCANAKAN", date: daysFromToday(5), expect: "DIRENCANAKAN", note: "5 hari lagi" },
  { status: "DIRENCANAKAN", date: daysFromToday(1), expect: "DIRENCANAKAN", note: "besok" },
  { status: "DIRENCANAKAN", date: daysFromToday(0, 23), expect: "BERLANGSUNG", note: "hari ini, jam belum sampai" },
  { status: "DIRENCANAKAN", date: daysFromToday(0, 0), expect: "BERLANGSUNG", note: "hari ini, jam sudah lewat" },
  { status: "BERLANGSUNG", date: daysFromToday(0, 10), expect: "BERLANGSUNG", note: "hari ini, status manual sudah Berlangsung" },
  { status: "DIRENCANAKAN", date: daysFromToday(-1), expect: "SELESAI", note: "kemarin" },
  { status: "BERLANGSUNG", date: daysFromToday(-3), expect: "SELESAI", note: "3 hari lalu, status manual masih Berlangsung" },
  { status: "SELESAI", date: daysFromToday(5), expect: "SELESAI", note: "manual Selesai lebih awal -- tidak ditimpa jadi Direncanakan" },
  { status: "DIBATALKAN", date: daysFromToday(-5), expect: "DIBATALKAN", note: "manual Dibatalkan -- tidak pernah ditimpa" },
  { status: "DIBATALKAN", date: daysFromToday(2), expect: "DIBATALKAN", note: "Dibatalkan untuk kegiatan yang belum terjadi" },
];

let failed = 0;
for (const c of cases) {
  const result = getEffectiveActivityStatus({ status: c.status as never, date: c.date });
  const ok = result === c.expect;
  if (!ok) failed++;
  console.log(`${ok ? "OK  " : "FAIL"} status=${c.status} -> ${result} (expect ${c.expect}) :: ${c.note}`);
}

console.log(`\n${cases.length - failed}/${cases.length} lolos`);
if (failed > 0) process.exit(1);
