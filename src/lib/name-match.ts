/**
 * Pencocokan nama longgar -- menghubungkan teks bebas (nama di spreadsheet,
 * `Position.memberName`) dengan akun anggota terdaftar (`User.name`).
 *
 * Di lapangan nama yang sama sering ditulis beda: marga vs nama tengah
 * ("Marlina Olivia ..." vs "Marlina Sihombing"), ejaan nama depan/tengah
 * beda ("Jhonson"/"Jonson", "Angelina"/"Angelia", "Shinta"/"Sinta"), atau
 * satu tempat cuma tulis nama depan ("Liza"). Tiga lapis pencocokan:
 *   1. Kunci 2 kata pertama sama (kasus paling umum).
 *   2. Nama depan sama + minimal 1 kata lain yang sama (deterministik,
 *      aman dari salah cocok -- mis. "Devi Janita Sitompul" vs
 *      "Devi Sitompul", "Angie Fania Manurung" vs "Angie Manurung").
 *   3. Alias identitas manual untuk kasus yang tidak bisa diturunkan dari
 *      aturan mana pun (ejaan nama depan beda, atau nama depan sama tanpa
 *      kata lain yang sama).
 */

/** Alias identitas yang HARUS dipetakan manual -- key = kunci 2 kata
 * pertama nama di akun web, value = kunci 2 kata pertama nama di sheet
 * KAS / Kepengurusan. Tambah entri di sini kalau ada anggota yang datanya
 * tidak ikut tersinkron karena namanya ditulis sangat berbeda di sheet. */
const IDENTITY_ALIASES: Record<string, string> = {
  "jonson manurung": "jhonson manurung",
  "liza marbun": "liza",
  "marlina olivia": "marlina sihombing",
  "marito oktavia": "marito rajagukguk",
};

function tokens(name: string): string[] {
  return name
    .trim()
    .toLowerCase()
    .replace(/\bbr\.?\b/g, " ") // "Br." / "boru" -- penanda marga ibu, bukan bagian nama
    .replace(/[^a-z\s']/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);
}

/**
 * Kunci pencocokan longgar: 2 kata pertama nama, huruf kecil, spasi rapi.
 * Dipakai untuk mengelompokkan nama & mendeteksi ambiguitas.
 */
export function firstTwoWordsKey(name: string): string {
  return tokens(name).slice(0, 2).join(" ");
}

/**
 * Apakah `freeText` (nama di sheet / memberName jabatan) merujuk orang yang
 * sama dengan `accountName` (nama akun terdaftar)? Lihat 3 lapis di atas.
 */
export function looseNameMatch(freeText: string, accountName: string): boolean {
  const tSheet = tokens(freeText);
  const tAccount = tokens(accountName);
  if (tSheet.length === 0 || tAccount.length === 0) return false;

  const keySheet = tSheet.slice(0, 2).join(" ");
  const keyAccount = tAccount.slice(0, 2).join(" ");

  // Lapis 1: kunci 2 kata pertama identik.
  if (keySheet === keyAccount) return true;

  // Lapis 3: alias identitas manual (dipetakan dari sisi akun web).
  if (IDENTITY_ALIASES[keyAccount] === keySheet) return true;

  // Lapis 2: nama depan sama + minimal 1 kata lain yang sama.
  if (tSheet[0] === tAccount[0]) {
    const restAccount = new Set(tAccount.slice(1));
    if (tSheet.slice(1).some((w) => restAccount.has(w))) return true;
  }

  return false;
}
