import { google } from "googleapis";

/**
 * Klien Google Sheets API terautentikasi via Service Account -- dipakai
 * untuk 2 hal yang TIDAK bisa dilakukan lewat CSV export publik (read-only):
 * 1. Daftar semua tab spreadsheet secara dinamis (supaya tab baru seperti
 *    "KAS 2027" atau "Rekapitulasi 2027" otomatis terdeteksi tanpa perlu
 *    ubah kode tiap tahun).
 * 2. Menulis baris anggota baru ke tab "KAS <tahun berjalan>" saat ada
 *    pendaftaran anggota baru di web (lihat /api/register).
 *
 * Perlu 2 env var (lihat panduan setup di README/AGENTS atau chat dengan
 * Admin): GOOGLE_SERVICE_ACCOUNT_EMAIL dan GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.
 * Service Account itu harus diundang sebagai Editor ke spreadsheet Bendahara.
 */

let cachedClient: ReturnType<typeof google.sheets> | null = null;

export function isGoogleSheetsConfigured(): boolean {
  return !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && !!process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
}

export function getSheetsClient() {
  if (cachedClient) return cachedClient;

  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  if (!email || !rawKey) {
    throw new Error(
      "GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY belum diset di environment variables."
    );
  }
  // Private key biasanya disimpan dengan "\n" literal (bukan newline asli)
  // saat dipaste ke env var -- perlu di-unescape.
  const privateKey = rawKey.replace(/\\n/g, "\n");

  const auth = new google.auth.JWT({
    email,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  cachedClient = google.sheets({ version: "v4", auth });
  return cachedClient;
}
