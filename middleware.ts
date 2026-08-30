// PIN-védelem az egész webre — csak bejelentkezett látogatók férnek hozzá
import { NextResponse, type NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Ha a látogató cookie-jában érvényes PIN van, mehet tovább
  const auth = req.cookies.get("site-auth")?.value;
  const sitePin = process.env.SITE_PIN || process.env.ADMIN_PIN || "";
  if (sitePin && (auth === sitePin || auth === process.env.ADMIN_PIN)) return NextResponse.next();

  // Nincs érvényes cookie — redirect a /login oldalra (a kért URL-t megőrizve)
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
