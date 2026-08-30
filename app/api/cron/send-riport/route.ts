import { NextResponse, type NextRequest } from "next/server";
import fs from "fs/promises";
import path from "path";
import { loadConfig } from "@/lib/server/config-store";
import { sendRiport } from "@/lib/server/riport-sender";
import type { TrafikData } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Vercel Cron: hívja `GET /api/cron/send-riport` óránként (a vercel.json-ban).
// Csak akkor küld, ha:
//   - config.aktiv === true
//   - jelenlegi UTC-óra === config.ora
// Ez ad rugalmasságot a felhasználó által beállított időpontnak.
export async function GET(req: NextRequest) {
  // Vercel Cron beteszi a "authorization: Bearer $CRON_SECRET" fejlécet, ha CRON_SECRET env létezik.
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization") || "";
    if (auth !== `Bearer ${secret}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const cfg = await loadConfig();
  if (!cfg.aktiv) return NextResponse.json({ skipped: "inactive" });
  const utcOra = new Date().getUTCHours();
  if (cfg.ora !== utcOra) return NextResponse.json({ skipped: `not the hour (cfg=${cfg.ora}, now=${utcOra})` });

  const jsonPath = path.join(process.cwd(), "public", "data", "trafik.json");
  const raw = await fs.readFile(jsonPath, "utf8");
  const data: TrafikData = JSON.parse(raw);
  const ma = new Date().toISOString().slice(0, 10);
  const datum = [...data.napok].filter(n => n < ma).sort().pop() || data.utolso_napi;

  try {
    const r = await sendRiport(data, datum, cfg.emails);
    return NextResponse.json({ ...r, datum });
  } catch (e) {
    return NextResponse.json({ ok: false, message: (e as Error).message }, { status: 500 });
  }
}
