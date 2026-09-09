import { PrismaClient } from "@/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";

// Neon serverless driver butuh WebSocket constructor di lingkungan Node.js
// (browser/edge sudah punya WebSocket native).
neonConfig.webSocketConstructor = ws;

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL belum diatur. Isi .env dengan connection string PostgreSQL (mis. dari Neon)."
    );
  }
  const adapter = new PrismaNeon({ connectionString });
  return new PrismaClient({
    adapter,
    // passwordHash TIDAK PERNAH ikut kebawa di hasil query manapun secara
    // default -- beberapa route sebelumnya tanpa sengaja mengembalikan
    // objek User lengkap (termasuk hash bcrypt-nya) lewat NextResponse.json.
    // Query yang benar-benar butuh hash-nya (login, verifikasi password
    // saat ini) harus override eksplisit dengan `omit: { passwordHash: false }`
    // di query itu sendiri -- lihat auth.ts & api/profile/password.
    omit: { user: { passwordHash: true } },
  });
}

type AppPrismaClient = ReturnType<typeof createPrismaClient>;

const globalForPrisma = globalThis as unknown as {
  prisma: AppPrismaClient | undefined;
};

export const prisma: AppPrismaClient = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
