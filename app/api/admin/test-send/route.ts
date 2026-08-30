import { NextResponse, type NextRequest } from "next/server";
import fs from "fs/promises";
import path from "path";
import { loadConfig } from "@/lib/server/config-store";
import { sendRiport } from "@/lib/server/riport-sender";
import { isAdmin } from "@/lib/server/admin-auth";
import type { TrafikData } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Nincs jogosultság" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const cfg = await loadConfig();
  const emails: string[] = Array.isArray(body.emails) && body.emails.length ? body.emails : cfg.emails;
  if (!emails.length) return NextResponse.json({ error: "Nincsenek beállított email-címek" }, { status: 400 });

  const jsonPath = path.join(process.cwd(), "public", "data", "trafik.json");
  const raw = await fs.readFile(jsonPath, "utf8");
  const data: TrafikData = JSON.parse(raw);

  // Előző napi kulcs kiválasztás — a legfrissebb "múltbeli" nap
  const ma = new Date().toISOString().slice(0, 10);
  const datum = [...data.napok].filter(n => n < ma).sort().pop() || data.utolso_napi;

  try {
    const r = await sendRiport(data, datum, emails);
    return NextResponse.json({ ...r, datum });
  } catch (e) {
    return NextResponse.json({ ok: false, message: (e as Error).message }, { status: 500 });
  }
}
