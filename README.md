# Sistem Keanggotaan Naposobulung HKBP Immanuel Dumai

Sistem manajemen keanggotaan digital untuk Punguan Naposobulung HKBP Immanuel
Dumai — bukan sekadar website informasi, tapi aplikasi untuk mengelola data
anggota, uang kas, kehadiran, kepengurusan, periode, dan kegiatan.

> Ingin men-deploy ke domain publik (misal `nhid.com`) supaya seluruh anggota
> bisa mendaftar dari mana saja? Lihat [DEPLOYMENT.md](DEPLOYMENT.md) untuk
> panduan lengkap (Vercel + Neon Postgres + domain).

## Fitur

- **Autentikasi & RBAC**: Login dengan email/password (hash bcrypt). Tiga role:
  `ADMIN`, `PENGURUS`, `ANGGOTA`. Pengurus bisa diberi izin granular (mis.
  `MANAGE_CASH_PAYMENT` khusus Bendahara) — diverifikasi di server, bukan
  cuma disembunyikan di UI.
- **Data Anggota**: CRUD lengkap (nomor anggota, nama, nama panggilan, jenis
  kelamin, tempat/tanggal lahir, alamat, status keanggotaan, foto), search/
  filter/pagination, privasi (anggota biasa tidak melihat kontak anggota lain).
- **Kas**: Iuran bulanan per anggota dicatat **hanya oleh pengurus berizin**
  (bukan self-service) — anggota hanya melihat status Lunas/Belum. Ledger
  organisasi (donasi, pengeluaran) terpisah. Laporan bulanan + export CSV +
  tampilan cetak/PDF via browser.
- **Kehadiran**: Dicatat pengurus per anggota per kegiatan (Hadir/Tidak
  Hadir/Izin/Sakit) — bukan RSVP mandiri.
- **Kegiatan**: CRUD kegiatan (ibadah, persekutuan, retreat, dst.), detail
  dengan daftar peserta & kehadiran.
- **Kepengurusan & Periode**: Struktur organisasi per periode, hanya satu
  periode aktif pada satu waktu, jabatan bebas (tidak dikunci jumlahnya).
- **Audit Log**: Semua aksi sensitif (kas, data anggota, user/izin,
  kepengurusan, periode) tercatat dan bisa dilihat Admin.
- **Pengumuman & Forum**: Papan pengumuman dan forum diskusi internal.

## Stack

- **Next.js 16** (App Router, Turbopack) + TypeScript
- **Tailwind CSS 4**
- **Prisma 7** (ORM) + **PostgreSQL** via driver adapter `@prisma/adapter-neon`
  (cocok untuk Neon/Vercel serverless, tanpa build native)
- **Auth.js (NextAuth v5)** — Credentials provider, session JWT
- **Zod** + **react-hook-form** untuk validasi form
- **Recharts** untuk grafik dashboard, **Vercel Blob** untuk upload foto di produksi

## Setup Lokal

### 1. Prasyarat

- Node.js 20.9+ (disarankan 22+)
- npm
- Database PostgreSQL — cara termudah: buat gratis di [neon.tech](https://neon.tech)
  (2 menit, tidak perlu install Postgres lokal)

### 2. Install dependency

```bash
npm install
```

### 3. Environment variables

Salin `.env.example` menjadi `.env`:

```bash
cp .env.example .env
```

Isi `.env`:

| Variabel | Keterangan |
| --- | --- |
| `DATABASE_URL` | Connection string PostgreSQL (dari Neon atau Postgres lain) |
| `AUTH_SECRET` | Secret untuk signing session JWT. Generate dengan `openssl rand -base64 32` |
| `NEXTAUTH_URL` | URL aplikasi, default `http://localhost:3000` |

### 4. Migrasi database

```bash
npx prisma migrate dev --name init
```

### 5. Seed data contoh

```bash
npx prisma db seed
```

Akun contoh setelah seeding (nama dummy, bukan data pribadi nyata):

| Role | Email | Password | Catatan |
| --- | --- | --- | --- |
| Admin | `admin@nhid.church` | `admin123` | Akses penuh |
| Pengurus (Bendahara) | `bendahara@nhid.church` | `pengurus123` | Izin: kelola kas |
| Pengurus (Sekretaris) | `sekretaris@nhid.church` | `pengurus123` | Izin: anggota, kegiatan, kehadiran |
| Anggota | `daniel@nhid.church`, `jonathan@nhid.church`, dst. | `anggota123` | Lihat `prisma/seed.ts` untuk daftar lengkap |

### 6. Jalankan development server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

## Perintah Lain

```bash
npm run build      # production build (type-check + build)
npm run lint        # ESLint
npm run start        # jalankan production build
npx prisma studio    # GUI untuk melihat/mengedit data
```

## Struktur Proyek

```
prisma/
  schema.prisma       # skema database
  seed.ts             # seed data contoh (10+ anggota, periode, jabatan, kegiatan, kas)
src/
  app/
    page.tsx          # landing page publik (Tentang, Kepengurusan, Kegiatan, Galeri, Kontak)
    login/, register/ # halaman autentikasi (publik)
    (app)/             # route group terproteksi (butuh login)
      layout.tsx        # shell dengan navbar (menu menyesuaikan role/izin)
      dashboard/         # dashboard beda untuk anggota vs pengurus (+ grafik)
      anggota/            # Data Anggota (CRUD, permission MANAGE_MEMBERS)
      kegiatan/            # Kegiatan (CRUD + input kehadiran per kegiatan)
      kehadiran/            # Overview kehadiran lintas kegiatan
      kas/, kas-saya/        # Kas organisasi & iuran (management vs read-only anggota)
      laporan-kas/            # Laporan bulanan + export CSV + cetak
      kepengurusan/, periode/  # Struktur organisasi & periode kepengurusan
      pengumuman/               # Pengumuman & forum
      profil/                    # Profil sendiri (tab info/kas/kehadiran/kegiatan)
      admin/                      # khusus ADMIN: user & izin, audit log, pengumuman
    api/                # route handlers — SEMUA endpoint mutasi sensitif
                        # memverifikasi permission di server (lihat lib/api-auth.ts)
  auth.ts             # konfigurasi Auth.js (Credentials provider, session bawa role+izin)
  proxy.ts            # proteksi rute (pengganti middleware.ts di Next.js 16)
  lib/
    permissions.ts     # helper cek izin (hasPermission)
    api-auth.ts         # requireUser / requireAdmin / requirePermission
    audit.ts             # logAudit — dipanggil di setiap mutasi sensitif
    validation.ts         # skema Zod untuk semua form/endpoint
  components/          # navbar, tabs, logo, providers
```

## Keputusan Desain Penting

- **Kas bukan self-service**: anggota TIDAK bisa mencatat/mengubah status
  pembayaran kas sendiri. Hanya user dengan izin `MANAGE_CASH_PAYMENT`
  (biasanya Bendahara) yang bisa — divalidasi di setiap endpoint terkait
  (`src/app/api/cash-payments/*`, `src/app/api/transactions/*`), mengembalikan
  `403` dengan pesan jelas jika tidak berizin.
- **Izin diverifikasi langsung ke database** di setiap mutasi (bukan hanya
  dari session/JWT) — supaya pencabutan izin oleh admin langsung berlaku
  tanpa menunggu user login ulang (lihat `requirePermission` di
  `src/lib/api-auth.ts`).
- **`User` merangkap tabel `users` dan `members`**: setiap akun login di
  aplikasi ini memang seorang anggota, jadi tidak dipisah ke tabel berbeda —
  mengurangi kompleksitas join tanpa kehilangan fungsi.
- **Privasi**: anggota biasa tidak bisa melihat nomor telepon/email anggota
  lain maupun riwayat kas/kehadiran anggota lain (kecuali dirinya sendiri,
  atau punya izin `MANAGE_MEMBERS`).

## Catatan Keamanan & Validasi

- Semua rute di luar `/`, `/login`, `/register`, dan `/api/auth*` dilindungi
  oleh `src/proxy.ts` (redirect ke `/login` jika belum login).
- Rute `/admin/*` hanya bisa diakses role `ADMIN`.
- Setiap API route memvalidasi input dengan Zod dan memeriksa sesi/izin
  sebelum melakukan operasi tulis — lihat tabel di atas untuk pola
  `requirePermission`.
- Password di-hash dengan bcrypt sebelum disimpan.
- Upload foto divalidasi tipe file (PNG/JPG/WEBP) dan ukuran maksimal 3MB.
