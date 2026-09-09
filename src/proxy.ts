import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { ADMIN_SECTION_PERMISSIONS } from "@/lib/permissions";

const publicRoutes = ["/", "/login", "/register", "/lupa-password"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const isPublicRoute = publicRoutes.includes(pathname);

  if (!isLoggedIn && !isPublicRoute) {
    const loginUrl = new URL("/login", req.nextUrl);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isLoggedIn && (pathname === "/login" || pathname === "/register")) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  // /admin/* dulunya khusus role ADMIN di sini, mengabaikan izin granular
  // (MANAGE_USERS, MANAGE_MEMBERS, VIEW_AUDIT_LOG) yang admin sudah
  // berikan ke seorang Pengurus -- akibatnya izin itu tidak pernah benar-
  // benar berfungsi (Pengurus tetap ditolak sebelum sempat mencapai
  // halamannya). Sekarang loloskan siapa pun yang punya salah satu izin
  // terkait; pengecekan yang lebih spesifik (izin persis untuk sub-
  // halaman yang dibuka) tetap dilakukan di masing-masing page.tsx.
  const hasAnyAdminPermission = ADMIN_SECTION_PERMISSIONS.some((p) =>
    req.auth?.user?.permissions?.includes(p)
  );
  if (
    pathname.startsWith("/admin") &&
    req.auth?.user?.role !== "ADMIN" &&
    !hasAnyAdminPermission
  ) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  // Kecualikan API, internal Next.js, folder /uploads, DAN file statis apa
  // pun di public/ (logo, favicon, dll — dikenali dari ekstensi file) dari
  // pengecekan login. Tanpa ini, aset publik seperti logo ikut diblokir
  // untuk pengunjung yang belum login, karena path-nya tidak persis "/",
  // "/login", atau "/register".
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|uploads|.*\\.(?:png|jpg|jpeg|webp|svg|gif|ico)$).*)",
  ],
};
