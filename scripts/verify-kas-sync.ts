import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { fetchAllDuesDetail } from "../src/lib/sheet-sync";
import { looseNameMatch, firstTwoWordsKey } from "../src/lib/name-match";

neonConfig.webSocketConstructor = ws;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL belum diatur.");
const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString }) });

async function main() {
  console.log("Mengambil data tab KAS dari spreadsheet...");
  const duesDetail = await fetchAllDuesDetail();
  for (const y of duesDetail) console.log(`  KAS ${y.year}: ${y.rows.length} baris anggota`);

  const users = await prisma.user.findMany({ select: { id: true, name: true, joinedAt: true } });
  console.log(`\nAkun terdaftar di web: ${users.length}`);

  const noAccount: { year: number; name: string }[] = [];
  const ambiguous: { year: number; name: string; accounts: string[] }[] = [];
  const matchedUserIds = new Set<string>();
  let matchedRows = 0;

  for (const y of duesDetail) {
    for (const row of y.rows) {
      const cand = users.filter((u) => looseNameMatch(row.name, u.name));
      if (cand.length === 0) noAccount.push({ year: y.year, name: row.name });
      else if (cand.length > 1)
        ambiguous.push({ year: y.year, name: row.name, accounts: cand.map((c) => c.name) });
      else {
        matchedRows++;
        matchedUserIds.add(cand[0].id);
      }
    }
  }

  console.log(`\n=== HASIL PENCOCOKAN ===`);
  console.log(`Baris sheet cocok ke 1 akun : ${matchedRows}`);
  console.log(`Baris sheet tanpa akun      : ${noAccount.length}`);
  console.log(`Baris sheet nama ambigu     : ${ambiguous.length}`);

  if (ambiguous.length) {
    console.log(`\n-- Nama sheet AMBIGU (cocok >1 akun) --`);
    for (const r of ambiguous) console.log(`   [${r.year}] ${r.name} -> ${r.accounts.join(" | ")}`);
  }

  const usersNoSheet = users.filter((u) => !matchedUserIds.has(u.id));
  console.log(`\n-- Akun web yang TIDAK ketemu di sheet KAS manapun (${usersNoSheet.length}) --`);
  for (const u of usersNoSheet)
    console.log(`   ${u.name}  (kunci: "${firstTwoWordsKey(u.name)}", joinedAt: ${u.joinedAt.toISOString().slice(0, 10)})`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
