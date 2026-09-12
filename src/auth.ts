import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validation";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
          include: { permissions: true },
          // Override default omit global (lihat lib/prisma.ts) -- login
          // butuh hash-nya untuk verifikasi password.
          omit: { passwordHash: false },
        });
        if (!user || !user.isActive) return null;

        const isValid = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!isValid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          permissions: user.permissions.map((p) => p.permission),
        };
      },
    }),
  ],
  callbacks: {
    // Bug: menonaktifkan akun ("Nonaktifkan" di halaman Kelola User) atau
    // menurunkan role Admin/Pengurus TIDAK berlaku untuk sesi yang sedang
    // berjalan -- session pakai strategi JWT, jadi role/status akun hanya
    // "difoto" sekali saat login dan disimpan di token. requirePermission()
    // sudah mengecek izin granular langsung ke DB tiap request (lihat
    // api-auth.ts), tapi role dan isActive TIDAK, sehingga akun yang baru
    // saja dinonaktifkan Admin tetap bisa memakai seluruh aplikasi sampai
    // token JWT-nya kedaluwarsa sendiri (default 30 hari).
    //
    // Perbaikan: verifikasi ulang ke DB setiap token diakses (bukan cuma
    // saat login). `user` hanya terisi tepat saat `signIn()` dipanggil;
    // pada akses berikutnya kita tarik ulang isActive/role/permissions
    // terkini. Return `null` men-invalidate token (efeknya seperti logout
    // paksa) kalau akun sudah dihapus/dinonaktifkan.
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
        token.permissions = user.permissions;
        return token;
      }

      if (!token.id) return token;
      const current = await prisma.user.findUnique({
        where: { id: token.id },
        select: { isActive: true, role: true, permissions: { select: { permission: true } } },
      });
      if (!current || !current.isActive) return null;

      token.role = current.role;
      token.permissions = current.permissions.map((p) => p.permission);
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.permissions = token.permissions;
      return session;
    },
  },
});
