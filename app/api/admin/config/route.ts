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
  const cfg = await loadConfig();
  return NextResponse.json(cfg);
}

export async function PUT(req: NextRequest) {
  if (!checkPin(req)) return NextResponse.json({ error: "Hibás PIN" }, { status: 401 });
  const body = await req.json();
  const cfg: RiportConfig = {
    emails: Array.isArray(body.emails)
      ? body.emails.map((e: unknown) => String(e).trim()).filter((e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))
      : [],
    ora: Math.max(0, Math.min(23, Number(body.ora) || 6)),
    aktiv: Boolean(body.aktiv),
  };
  await saveConfig(cfg);
  return NextResponse.json({ ok: true, config: cfg });
}
