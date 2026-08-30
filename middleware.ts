// PIN-védelem az egész webre — csak bejelentkezett látogatók férnek hozzá
import { NextResponse, type NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  // 1) URL-ben ?token=xxx (email-linkből) → cookie set + tiszta URL-re redirect
  const emailToken = process.env.EMAIL_LINK_TOKEN;
  const suppliedToken = searchParams.get("token");
  if (emailToken && suppliedToken && suppliedToken === emailToken) {
    const cleanUrl = req.nextUrl.clone();
    cleanUrl.searchParams.delete("token");
    const res = NextResponse.redirect(cleanUrl);
    res.cookies.set("site-auth", process.env.SITE_PIN || process.env.ADMIN_PIN || "", {
      httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30,
    });
    return res;
  }

  // 2) Cookie-alapú belépés
  const auth = req.cookies.get("site-auth")?.value;
  const sitePin = process.env.SITE_PIN || process.env.ADMIN_PIN || "";
  if (sitePin && (auth === sitePin || auth === process.env.ADMIN_PIN)) return NextResponse.next();

  // 3) Nincs jó auth → /login (a kért URL-t megőrizve)
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = `?from=${encodeURIComponent(pathname)}`;
  return NextResponse.redirect(url);
}

// Csak a publikus HTML+data-fájlokat védjük — a static asseteket (icon, manifest, _next/*) nem
export const config = {
  matcher: [
    "/((?!api/cron|api/auth|login|_next/static|_next/image|favicon|apple-touch-icon|icon-|icon\\.svg|manifest\\.json).*)",
  ],
};
