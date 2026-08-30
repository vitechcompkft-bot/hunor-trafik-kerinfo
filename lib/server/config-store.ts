// Admin-konfig tárolása Upstash Redis-ben (Vercel Marketplace-en 1 kattintás).
// Env: UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN (auto-provisioned)
import { Redis } from "@upstash/redis";

export type RiportConfig = {
  emails: string[];
  ora: number;       // 0-23 (UTC-ben — a Vercel Cron mindig UTC-t használ)
  aktiv: boolean;
};

const DEFAULT_CONFIG: RiportConfig = {
  emails: [],
  ora: 6,
  aktiv: false,
};

const KEY = "trafik:riport-config";

function redis() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) throw new Error("UPSTASH_REDIS_REST_URL/TOKEN nincs beállítva a Vercel env-ben");
  return new Redis({ url, token });
}

export async function loadConfig(): Promise<RiportConfig> {
  try {
    const r = await redis().get<RiportConfig>(KEY);
    if (!r) return DEFAULT_CONFIG;
    return { ...DEFAULT_CONFIG, ...r };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export async function saveConfig(cfg: RiportConfig): Promise<void> {
  await redis().set(KEY, cfg);
}
