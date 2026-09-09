import Link from "next/link";
import Image from "next/image";
import { Logo, HkbpLogo } from "@/components/logo";
import { prisma } from "@/lib/prisma";
import { ACTIVITY_TYPE_LABELS } from "@/lib/labels";

// Landing page menampilkan data live (kegiatan, kepengurusan, galeri) —
// tidak boleh di-prerender statis saat build karena datanya berubah-ubah
// dan build tidak selalu punya koneksi database.
export const dynamic = "force-dynamic";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(date);
}

export default async function Home() {
  const [activePeriod, upcomingActivities, gallery] = await Promise.all([
    prisma.managementPeriod.findFirst({ where: { isActive: true } }),
    prisma.activity.findMany({
      where: { date: { gte: new Date() }, status: { not: "DIBATALKAN" } },
      orderBy: { date: "asc" },
      take: 3,
      select: { id: true, name: true, type: true, date: true, location: true },
    }),
    prisma.activity.findMany({
      where: { photoUrl: { not: null } },
      orderBy: { date: "desc" },
      take: 6,
      select: { id: true, name: true, photoUrl: true },
    }),
  ]);

  const positions = activePeriod
    ? await prisma.position.findMany({
        where: { periodId: activePeriod.id, status: "AKTIF" },
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
        take: 8,
        include: { user: { select: { name: true, photoUrl: true } } },
      })
    : [];

  return (
    <div className="flex flex-1 flex-col">
      <header className="bg-brand-darker">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <HkbpLogo size={34} />
            <Logo size={38} withRing={false} />
            <span className="text-sm font-extrabold uppercase tracking-wide text-white sm:text-base">
              NHKBP Immanuel Dumai
            </span>
          </div>
          <nav className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-md px-3 py-2 text-sm font-semibold text-blue-100 hover:bg-white/10 hover:text-white"
            >
              Masuk
            </Link>
            <Link
              href="/register"
              className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-brand-darker hover:bg-blue-50"
            >
              Daftar
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative overflow-hidden bg-gradient-to-b from-brand-darker via-brand-dark to-brand">
          <div className="mx-auto flex max-w-5xl flex-col items-center gap-8 px-4 py-16 text-center sm:px-6 sm:py-24">
            <div className="flex items-center gap-4">
              <HkbpLogo size={72} />
              <Logo size={96} />
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-200">
                Punguan Naposobulung HKBP Immanuel Dumai
              </p>
              <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
                Naposobulung Immanuel Dumai
              </h1>
              <p className="mx-auto mt-6 max-w-xl text-lg text-blue-100">
                Berakar dalam iman, bertumbuh dalam kebersamaan, dan melayani dengan kasih.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/login"
                className="rounded-md bg-white px-6 py-3 text-sm font-bold text-brand-darker shadow-lg hover:bg-blue-50"
              >
                Login Anggota
              </Link>
              <Link
                href="/register"
                className="rounded-md border-2 border-white/70 px-6 py-3 text-sm font-bold text-white hover:bg-white/10"
              >
                Daftar Sekarang
              </Link>
            </div>
          </div>
        </section>

        <section id="tentang" className="bg-white">
          <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
            <h2 className="text-2xl font-bold text-slate-900">Tentang Naposobulung</h2>
            <p className="mt-4 max-w-3xl text-slate-600">
              Naposobulung adalah persekutuan muda-mudi HKBP Immanuel Dumai — wadah bagi
              generasi muda jemaat untuk bertumbuh dalam iman, membangun kebersamaan, dan
              melayani gereja serta masyarakat. Website ini adalah sistem keanggotaan digital
              yang membantu pengurus dan anggota mengelola data keanggotaan, kas, kehadiran,
              dan kegiatan Naposobulung secara transparan dan tertib.
            </p>
          </div>
        </section>

        <section id="kepengurusan" className="border-t border-slate-100 bg-slate-50">
          <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
            <h2 className="text-2xl font-bold text-slate-900">Kepengurusan</h2>
            <p className="mt-2 text-sm text-slate-500">
              {activePeriod ? activePeriod.name : "Periode kepengurusan belum diatur."}
            </p>
            {positions.length > 0 ? (
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {positions.map((p) => {
                  const name = p.user?.name ?? p.memberName ?? "-";
                  return (
                    <div key={p.id} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4">
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-blue-100">
                        {p.user?.photoUrl ? (
                          <Image src={p.user.photoUrl} alt={name} fill className="object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-brand">
                            {name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{p.title}</p>
                        <p className="text-sm text-slate-500">{name}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-500">Struktur kepengurusan belum tersedia.</p>
            )}
          </div>
        </section>

        <section id="kegiatan" className="bg-white">
          <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
            <h2 className="text-2xl font-bold text-slate-900">Kegiatan Mendatang</h2>
            {upcomingActivities.length > 0 ? (
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                {upcomingActivities.map((a) => (
                  <div key={a.id} className="rounded-lg border border-slate-200 p-4">
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-600">
                      {ACTIVITY_TYPE_LABELS[a.type]}
                    </span>
                    <h3 className="mt-2 font-semibold text-slate-900">{a.name}</h3>
                    <p className="mt-1 text-sm text-slate-500">{formatDate(a.date)}</p>
                    <p className="text-sm text-slate-500">{a.location}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-500">Belum ada kegiatan mendatang.</p>
            )}
          </div>
        </section>

        {gallery.length > 0 && (
          <section id="galeri" className="border-t border-slate-100 bg-slate-50">
            <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
              <h2 className="text-2xl font-bold text-slate-900">Galeri</h2>
              <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
                {gallery.map((a) => (
                  <div key={a.id} className="relative aspect-square overflow-hidden rounded-lg bg-slate-200">
                    {a.photoUrl && (
                      <Image src={a.photoUrl} alt={a.name} fill className="object-cover" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        <section id="informasi" className="bg-white">
          <div className="mx-auto grid max-w-5xl gap-8 px-4 py-16 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
            {[
              { title: "Data Anggota", desc: "Kelola data keanggotaan lengkap secara terpusat." },
              { title: "Kehadiran & Kegiatan", desc: "Catat kehadiran dan kelola jadwal kegiatan." },
              { title: "Uang Kas", desc: "Pencatatan iuran bulanan yang transparan dan akuntabel." },
              { title: "Laporan", desc: "Laporan keuangan dan statistik keanggotaan real-time." },
            ].map((f) => (
              <div key={f.title} className="border-l-4 border-brand pl-4">
                <h3 className="text-base font-bold text-slate-900">{f.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="kontak" className="border-t border-slate-100 bg-slate-50">
          <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
            <h2 className="text-2xl font-bold text-slate-900">Kontak</h2>
            <p className="mt-4 text-slate-600">
              Gereja HKBP Immanuel Ressort Immanuel Dumai — Jl. Pulau Mampu, Kota Dumai, Riau
            </p>
            <p className="mt-1 text-slate-500">
              Instagram &amp; TikTok:{" "}
              <a
                href="https://instagram.com/nhkbp_immanuel_dumai"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-brand hover:underline"
              >
                @nhkbp_immanuel_dumai
              </a>
            </p>
          </div>
        </section>
      </main>

      <footer className="bg-brand-darker py-6">
        <p className="mx-auto max-w-5xl px-4 text-center text-sm text-blue-100 sm:px-6">
          &copy; {new Date().getFullYear()} Punguan Naposobulung HKBP Immanuel Dumai
        </p>
      </footer>
    </div>
  );
}
