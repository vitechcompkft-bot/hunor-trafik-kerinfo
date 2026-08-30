import { NextResponse, type NextRequest } from "next/server";
import { loadConfig, saveConfig, type RiportConfig } from "@/lib/server/config-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function checkPin(req: NextRequest): boolean {
  const pin = process.env.ADMIN_PIN;
  if (!pin) return false;
  const supplied = req.headers.get("x-admin-pin") || "";
  return supplied === pin;
}

export async function GET(req: NextRequest) {
  if (!checkPin(req)) return NextResponse.json({ error: "Hibás PIN" }, { status: 401 });
  try {
    const cfg = await loadConfig();
    return NextResponse.json(cfg);
  } catch (e) {
    return NextResponse.json({ error: "Redis-olvasás hiba: " + (e as Error).message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  if (!checkPin(req)) return NextResponse.json({ error: "Hibás PIN" }, { status: 401 });
  const body = await req.json();
  const cfg: RiportConfig = {
    emails: Array.isArray(body.emails)
      ? body.emails.map((e: unknown) => String(e).trim()).filter((e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))
      : [],
    ora: Math.max(0, Math.min(23, Number(body.ora) || 4)),
    aktiv: Boolean(body.aktiv),
  };
  try {
    await saveConfig(cfg);
    return NextResponse.json({ ok: true, config: cfg });
  } catch (e) {
    return NextResponse.json({ ok: false, error: "Redis-mentés hiba: " + (e as Error).message }, { status: 500 });
  }
}
