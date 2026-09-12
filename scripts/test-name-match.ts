import { looseNameMatch } from "../src/lib/name-match";

type Case = { sheet: string; account: string; expect: boolean; note: string };

const cases: Case[] = [
  // Kasus baru yang jadi tujuan perbaikan ini: daftar dengan 1-2 kata tanpa marga.
  { sheet: "Calvin", account: "Calvin", expect: true, note: "1 kata vs 1 kata, sama persis" },
  { sheet: "Calvin Sitompul", account: "Calvin", expect: true, note: "daftar 1 kata, sheet ada marga" },
  { sheet: "Marlina Olivia Lumban Toruan", account: "Marlina Olivia", expect: true, note: "daftar 2 kata (nama+tengah) tanpa marga" },
  { sheet: "Kezia", account: "Kezia", expect: true, note: "1 kata vs 1 kata" },
  { sheet: "Yehezki Bintang", account: "Yehezki", expect: true, note: "daftar cuma nama depan" },

  // Regresi: kasus yang sudah pernah diperbaiki sebelumnya harus tetap lolos.
  { sheet: "Jhonson Manurung", account: "Jonson Manurung", expect: true, note: "alias ejaan" },
  { sheet: "Liza", account: "Liza Marbun", expect: true, note: "alias 1 kata" },
  { sheet: "Angie Manurung", account: "Angie Fania Manurung", expect: true, note: "kata tengah beda, marga sama" },
  { sheet: "Henni Angelia Gea", account: "Henni Angelina Gea", expect: true, note: "ejaan nama tengah beda" },
  { sheet: "Devi Janita Sitompul", account: "Devi Sitompul", expect: true, note: "akun tanpa nama tengah" },
  { sheet: "Marito Rajagukguk", account: "Marito Oktavia", expect: true, note: "alias marga beda" },

  // Negatif: HARUS tetap tidak cocok (uji tidak ada regresi jadi kelonggaran berlebihan).
  // Catatan: "kata tengah kebetulan sama tapi marga beda" (mis. "John
  // Michael Doe" vs "John Michael Smith") SENGAJA dianggap cocok oleh
  // lapis 2 -- itu trade-off yang sudah diterima sejak awal (lihat
  // "Devi Janita Sitompul" vs "Devi Sitompul" di atas, mekanismenya sama),
  // bukan regresi dari perubahan lapis prefix di PR ini.
  { sheet: "Ricky Julio Rajagukguk", account: "Ricky Andi Simanjuntak", expect: false, note: "nama depan sama, tidak ada kata lain yang sama & bukan awalan" },
  { sheet: "Agnes Rohani Ritonga", account: "Agnes Simanjuntak", expect: false, note: "nama depan sama, tidak ada kata lain yang sama" },
  { sheet: "Samuel Simanjuntak", account: "Samuel Manalu", expect: false, note: "marga beda total, tidak boleh cocok" },
];

let failed = 0;
for (const c of cases) {
  const result = looseNameMatch(c.sheet, c.account);
  const ok = result === c.expect;
  if (!ok) failed++;
  console.log(
    `${ok ? "OK  " : "FAIL"} sheet="${c.sheet}" account="${c.account}" -> ${result} (expect ${c.expect}) :: ${c.note}`
  );
}

console.log(`\n${cases.length - failed}/${cases.length} lolos`);
if (failed > 0) process.exit(1);
