// Egységesített admin-ellenőrzés: cookie (site-auth = ADMIN_PIN) VAGY explicit x-admin-pin fejléc
import type { NextRequest } from "next/server";

export function isAdmin(req: NextRequest): boolean {
  const adminPin = process.env.ADMIN_PIN;
  if (!adminPin) return false;
  const cookieAuth = req.cookies.get("site-auth")?.value;
  if (cookieAuth === adminPin) return true;
  const headerPin = req.headers.get("x-admin-pin") || "";
  return headerPin === adminPin;
}
