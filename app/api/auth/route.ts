import { NextResponse, type NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/auth — belépés PIN-nel
export async function POST(req: NextRequest) {
  const { pin, from } = await req.json().catch(() => ({ pin: "", from: "/" }));
  const sitePin = process.env.SITE_PIN || process.env.ADMIN_PIN || "";
  if (!sitePin) return NextResponse.json({ error: "SITE_PIN nincs beállítva" }, { status: 500 });
  if (String(pin) !== sitePin && String(pin) !== process.env.ADMIN_PIN) {
    return NextResponse.json({ error: "Hibás PIN" }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true, redirect: from || "/" });
  res.cookies.set("site-auth", String(pin), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,  // 30 nap
  });
  return res;
}

// DELETE /api/auth — kilépés
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set("site-auth", "", { path: "/", maxAge: 0 });
  return res;
}
