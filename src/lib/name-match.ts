/**
 * Kunci pencocokan nama longgar -- dipakai untuk menghubungkan data teks
 * bebas (nama di spreadsheet, `Position.memberName`) dengan akun anggota
 * terdaftar (`User.name`). SENGAJA cuma 2 kata pertama (nama depan), bukan
 * nama lengkap persis sama -- di lapangan nama yang dicatat di spreadsheet
 * sering beda marga/nama belakang dengan nama di akun (mis. "Marlina
 * Olivia Sihombing" di satu tempat vs "Marlina Olivia Lumban Toruan" di
 * tempat lain -- orang yang sama). Huruf kecil semua + spasi ganda
 * dirapikan supaya beda kapitalisasi/spasi tidak menggagalkan pencocokan.
 */
export function firstTwoWordsKey(name: string): string {
  const words = name.trim().toLowerCase().replace(/\s+/g, " ").split(" ").filter(Boolean);
  return words.slice(0, 2).join(" ");
}
