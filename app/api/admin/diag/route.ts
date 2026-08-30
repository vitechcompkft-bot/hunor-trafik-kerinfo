import { NextResponse, type NextRequest } from "next/server";
import { diagRedisEnv, loadConfig, saveConfig } from "@/lib/server/config-store";
import { isAdmin } from "@/lib/server/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Nincs jogosultság" }, { status: 401 });
  const envDiag = diagRedisEnv();
  const gmail = { user_set: !!process.env.GMAIL_USER, pass_set: !!process.env.GMAIL_APP_PASSWORD };

  let load_ok = false, load_err: string | null = null;
  let cfg = null;
  try { cfg = await loadConfig(); load_ok = true; } catch (e) { load_err = (e as Error).message; }

  // Round-trip teszt: mentsük vissza ugyanazt, majd olvassuk
  let roundtrip_ok = false, roundtrip_err: string | null = null;
  try {
    if (cfg) { await saveConfig(cfg); const back = await loadConfig(); roundtrip_ok = JSON.stringify(cfg) === JSON.stringify(back); }
  } catch (e) { roundtrip_err = (e as Error).message; }

  return NextResponse.json({ env: envDiag, gmail, load_ok, load_err, cfg, roundtrip_ok, roundtrip_err });
}
