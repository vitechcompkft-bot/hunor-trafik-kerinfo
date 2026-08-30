export type NapiSor = {
  bolt: string; nev: string;
  forgalom: number; vevoszam: number;
  arres_ne: number; arres_sz: number;
  keszlet_br: number;
  leertekeles: number; leiras_br: number; emozg_br: number;
  arres_veszteseg: number;
};
export type HaviSor = {
  bolt: string; nev: string;
  forgalom: number; forgalom_bazis: number;
  vevoszam: number; vevoszam_bazis: number;
  keszlet: number; arres: number; arres_szint: number;
  leertekeles: number; leiras_br: number; emozg_br: number;
};

export type TrafikData = {
  generated_at: string;
  utolso_napi: string;
  napok: string[];
  havi_kulcsok: string[];
  napi: Record<string, NapiSor[]>;
  havi: Record<string, HaviSor[]>;
  trafik_nevek: Record<string, string>;
};
