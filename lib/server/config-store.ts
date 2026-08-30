// Admin-konfig tárolása Upstash Redis-ben (Vercel Marketplace-en 1 kattintás).
// Env: rugalmas — UPSTASH_REDIS_REST_URL / KV_REST_API_URL / KV_URL bármelyik lehet
import { Redis } from "@upstash/redis";

export type RiportConfig = {
  emails: string[];
  ora: number;       // 0-23 (UTC-ben — a Vercel Cron mindig UTC-t használ)
  aktiv: boolean;
};

const DEFAULT_CONFIG: RiportConfig = {
  emails: [],
  ora: 4,
  aktiv: false,
};

const KEY = "trafik:riport-config";

function pickRedisEnv() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || process.env.STORAGE_UPSTASH_REDIS_REST_URL || process.env.STORAGE_KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || process.env.STORAGE_UPSTASH_REDIS_REST_TOKEN || process.env.STORAGE_KV_REST_API_TOKEN;
  return { url, token };
}

function redis() {
  const { url, token } = pickRedisEnv();
  if (!url || !token) throw new Error("Redis env-változó nincs beállítva (várt: UPSTASH_REDIS_REST_URL/TOKEN vagy KV_REST_API_URL/TOKEN)");
  return new Redis({ url, token });
}

export async function loadConfig(): Promise<RiportConfig> {
  const r = await redis().get<RiportConfig>(KEY);
  if (!r) return DEFAULT_CONFIG;
  return { ...DEFAULT_CONFIG, ...r };
}

export async function saveConfig(cfg: RiportConfig): Promise<void> {
  await redis().set(KEY, cfg);
}

// Diagnosztika — mit lát a szerver az env-változók között (nem szivárogtat titkos értéket)
export function diagRedisEnv() {
  const keys = ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN", "KV_REST_API_URL", "KV_REST_API_TOKEN", "KV_URL", "STORAGE_UPSTASH_REDIS_REST_URL", "STORAGE_KV_REST_API_URL"];
  const found: Record<string, string> = {};
  for (const k of keys) if (process.env[k]) found[k] = "SET";
  const picked = pickRedisEnv();
  return {
    envs_seen: found,
    picked_url_set: !!picked.url,
    picked_token_set: !!picked.token,
    all_env_names_starting_with: Object.keys(process.env).filter(k => /UPSTASH|KV_/.test(k)),
  };
}
