# Deploy ke Produksi (nhid.com)

Panduan ini untuk membuat website bisa diakses publik di `https://nhid.com`, supaya
seluruh anggota bisa mendaftar dari mana saja. Semua langkah di sini perlu Anda
lakukan sendiri (perlu akun & kartu pembayaran Anda) — saya sudah menyiapkan
kodenya agar tinggal ikuti langkah-langkah ini.

## Ringkasan Arsitektur Produksi

| Lokal (sekarang) | Produksi |
| --- | --- |
| Next.js dev server di laptop | Vercel (hosting Next.js) |
| PostgreSQL (Neon) | Neon Postgres yang sama, atau project Neon terpisah untuk produksi |
| Foto profil/dokumentasi disimpan di folder lokal | Vercel Blob Storage |
| `http://localhost:3000` | `https://nhid.com` |

Tidak perlu server sendiri (VPS) — semuanya "serverless" dan gratis untuk
pemakaian skala Naposobulung (puluhan-ratusan anggota).

---

## 1. Push kode ke GitHub

Vercel deploy langsung dari repo GitHub.

1. Buat akun GitHub (jika belum ada): https://github.com/signup
2. Buat repository baru (kosong, jangan centang "Add README") di https://github.com/new
3. Di folder proyek, jalankan:

```bash
git add -A
git commit -m "Setup sistem keanggotaan Naposobulung Immanuel Dumai"
git remote add origin https://github.com/USERNAME-ANDA/nhid.git
git branch -M main
git push -u origin main
```

Ganti `USERNAME-ANDA` dan nama repo sesuai punya Anda.

---

## 2. Buat database PostgreSQL di Neon

1. Daftar gratis di https://neon.tech (bisa login dengan GitHub)
2. Buat project baru, beri nama misalnya `nhid-production`
3. Di dashboard Neon, salin **Connection string** (mode "Pooled connection")
   — bentuknya seperti:
   `postgresql://user:password@ep-xxxxx-pooler.region.aws.neon.tech/neondb?sslmode=require`
4. Terapkan skema database dari laptop Anda (pastikan `.env` lokal sudah
   diisi dengan connection string ini, atau override langsung di perintah):

```bash
DATABASE_URL="postgresql://...connection-string-neon-anda..." npx prisma migrate deploy
```

5. (Opsional) isi data contoh awal — **lewati langkah ini jika tidak mau ada
   akun contoh di server produksi**, dan langsung daftar akun admin asli lewat
   halaman `/register` lalu ubah role-nya jadi `ADMIN` lewat Prisma Studio:

```bash
DATABASE_URL="postgresql://...connection-string-neon-anda..." npx prisma db seed
```

> Tips: buat 2 project Neon terpisah — satu untuk development (dipakai di
> `.env` lokal), satu untuk production (dipakai di Vercel) — supaya data
> latihan Anda tidak tercampur dengan data produksi.

---

## 3. Deploy ke Vercel

1. Daftar di https://vercel.com (gratis, login dengan akun GitHub yang sama)
2. Klik **Add New > Project**, pilih repo GitHub yang tadi di-push
3. Vercel otomatis mendeteksi Next.js — biarkan pengaturan build default
4. Sebelum klik Deploy, buka **Environment Variables** dan isi:

| Key | Value |
| --- | --- |
| `DATABASE_URL` | Connection string Neon produksi (dari langkah 2) |
| `AUTH_SECRET` | hasil dari `openssl rand -base64 32` (atau generate di https://generate-secret.vercel.app/32) |
| `NEXTAUTH_URL` | `https://nhid.com` (isi ini setelah domain aktif; sementara boleh isi URL `*.vercel.app` yang diberikan Vercel) |

5. Klik **Deploy**. Setelah selesai, Anda akan dapat URL sementara seperti
   `https://nhid.vercel.app` — coba buka dan pastikan halaman muncul.

---

## 4. Aktifkan Vercel Blob (untuk upload foto profil & dokumentasi kegiatan)

1. Di dashboard project Vercel, buka tab **Storage**
2. Klik **Create Database > Blob**, beri nama (misal `nhid-uploads`), lalu **Connect** ke project ini
3. Vercel otomatis menambahkan environment variable `BLOB_READ_WRITE_TOKEN` —
   tidak perlu isi manual
4. Redeploy project (Deployments > tombol **Redeploy** pada deployment terakhir)
   agar env variable baru terpakai

---

## 5. Beli domain nhid.com

Anda belum punya domain ini, jadi perlu dibeli sendiri (saya tidak bisa
melakukan transaksi pembelian untuk Anda). Beberapa pilihan registrar:

- **Niagahoster/Hostinger** (hostinger.com/id) — populer di Indonesia, harga `.com` sekitar Rp 110.000–150.000/tahun
- **Rumahweb** (rumahweb.com) — alternatif lokal lain
- **Namecheap** (namecheap.com) — internasional, pembayaran kartu kredit/PayPal
- **Vercel Domains** (langsung dari dashboard Vercel > Domains) — paling praktis karena otomatis tersambung tanpa atur DNS manual, tapi harga biasanya sedikit lebih mahal

Cek dulu ketersediaan `nhid.com` sebelum lanjut, karena domain 3-4 huruf
sering sudah dimiliki orang lain — siapkan alternatif seperti
`nhid-dumai.com` atau `naposoimmanueldumai.com` kalau `nhid.com` ternyata
tidak tersedia.

---

## 6. Hubungkan domain ke Vercel

1. Di dashboard project Vercel, buka tab **Domains**
2. Ketik `nhid.com`, klik **Add**
3. Vercel akan menampilkan instruksi DNS (biasanya berupa **A record** mengarah
   ke `76.76.21.21` dan/atau **CNAME** `www` ke `cname.vercel-dns.com`)
4. Masuk ke panel DNS di tempat Anda beli domain (Niagahoster/Rumahweb/dsb),
   tambahkan record persis sesuai instruksi Vercel tersebut
5. Tunggu propagasi DNS (biasanya 10 menit – beberapa jam). Vercel akan
   otomatis mengaktifkan HTTPS begitu DNS terverifikasi
6. Setelah domain aktif, update environment variable di Vercel:
   - `NEXTAUTH_URL` = `https://nhid.com`
   - Redeploy project agar perubahan ini terpakai

---

## 7. Verifikasi akhir

- [ ] Buka `https://nhid.com` — landing page tampil dengan HTTPS (gembok hijau)
- [ ] Coba daftar akun baru lewat `/register`
- [ ] Login, cek dashboard, data anggota, kegiatan, kas saya, pengumuman
- [ ] Upload foto profil — pastikan foto muncul (berarti Vercel Blob berfungsi)
- [ ] Login sebagai admin (akun dari seed, atau ubah manual role akun pertama
      jadi `ADMIN` lewat Prisma Studio), cek `/admin/users`, `/admin/audit-log`
- [ ] Login sebagai anggota biasa, pastikan **tidak ada** tombol "Bayar" di
      Kas Saya dan tidak bisa akses `/kas` (harus redirect)
- [ ] Coba akses endpoint kas tanpa izin (mis. lewat akun anggota) — pastikan
      dapat HTTP 403 dengan pesan "Anda tidak memiliki izin..."

## Menjaga Kelangsungan & Data

- Setiap `git push` ke branch `main` akan otomatis redeploy ke `nhid.com` (CI/CD bawaan Vercel)
- Backup database: gunakan fitur **Branching/Backup** di dashboard Neon, atau
  `pg_dump "connection-string-anda" > backup.sql` secara berkala
- Free tier Neon cukup untuk ribuan baris data; upgrade hanya jika jemaat sudah sangat besar
