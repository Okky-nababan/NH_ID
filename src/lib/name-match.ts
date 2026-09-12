/**
 * Pencocokan nama longgar -- menghubungkan teks bebas (nama di spreadsheet,
 * `Position.memberName`) dengan akun anggota terdaftar (`User.name`).
 *
 * Di lapangan nama yang sama sering ditulis beda: marga vs nama tengah
 * ("Marlina Olivia ..." vs "Marlina Sihombing"), ejaan nama depan/tengah
 * beda ("Jhonson"/"Jonson", "Angelina"/"Angelia", "Shinta"/"Sinta"), satu
 * tempat cuma tulis nama depan ("Liza"), ATAU anggota baru daftar di web
 * cuma pakai 1-2 kata nama tanpa marga (mis. daftar sebagai "Calvin" atau
 * "Marlina Olivia" padahal di sheet KAS tercatat "Calvin Sitompul" /
 * "Marlina Olivia Lumban Toruan"). Tiga lapis pencocokan:
 *   1. Salah satu nama adalah AWALAN (prefix) kata-per-kata dari nama yang
 *      lain -- menangani pendaftaran dengan nama dipersingkat (1 kata, atau
 *      nama depan+tengah tanpa marga) terhadap catatan sheet yang nama
 *      lengkapnya lebih panjang (atau sebaliknya). Sengaja POSISIONAL
 *      (bukan cuma "2 kata pertama sama persis") supaya "John Michael Doe"
 *      tidak salah cocok ke "John Michael Smith" -- itu 2 orang berbeda
 *      walau 2 kata pertama sama.
 *   2. Nama depan sama + minimal 1 kata lain yang sama (deterministik,
 *      aman dari salah cocok -- mis. "Devi Janita Sitompul" vs
 *      "Devi Sitompul", "Angie Fania Manurung" vs "Angie Manurung").
 *   3. Alias identitas manual untuk kasus yang tidak bisa diturunkan dari
 *      aturan mana pun (ejaan nama depan beda, atau nama depan sama tanpa
 *      kata lain yang sama).
 *
 * PENTING: pencocokan longgar begini SELALU dipakai bareng pengecekan
 * ambiguitas di pemanggilnya (skip kalau cocok ke >1 akun berbeda) --
 * lihat cash-payment-sync.ts & position-sync.ts. Melonggarkan aturan di
 * sini aman karena kasus yang benar-benar ambigu (mis. ada 2 "Calvin"
 * berbeda terdaftar) tetap dilewati, bukan ditebak sembarangan.
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

/** Apakah `shorter` sama persis dengan kata-kata AWAL `longer`, posisi per
 * posisi? (mis. ["calvin"] adalah awalan ["calvin","sitompul"]). Sengaja
 * posisional (bukan sekadar "semua kata `shorter` ada di `longer`") supaya
 * "John Michael Doe" tidak salah cocok ke "John Michael Smith" -- itu 2
 * orang berbeda walau 2 kata pertama sama. */
function isPositionalPrefix(shorter: string[], longer: string[]): boolean {
  return shorter.length > 0 && shorter.every((word, i) => longer[i] === word);
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

  // Lapis 1: awalan kata-per-kata -- nama yang lebih pendek (mis. anggota
  // daftar cuma "Calvin" atau "Marlina Olivia") persis sama dengan awal
  // nama yang lebih panjang (mis. "Calvin Sitompul", "Marlina Olivia
  // Lumban Toruan"), atau sebaliknya. Ini juga otomatis menangani kasus
  // nama identik persis (kedua sisi jadi "awalan" satu sama lain).
  const [shorter, longer] =
    tSheet.length <= tAccount.length ? [tSheet, tAccount] : [tAccount, tSheet];
  if (isPositionalPrefix(shorter, longer)) return true;

  // Lapis 2: nama depan sama + minimal 1 kata lain yang sama.
  if (tSheet[0] === tAccount[0]) {
    const restAccount = new Set(tAccount.slice(1));
    if (tSheet.slice(1).some((w) => restAccount.has(w))) return true;
  }

  // Lapis 3: alias identitas manual (dipetakan dari sisi akun web).
  const keySheet = tSheet.slice(0, 2).join(" ");
  const keyAccount = tAccount.slice(0, 2).join(" ");
  if (IDENTITY_ALIASES[keyAccount] === keySheet) return true;

  return false;
}
