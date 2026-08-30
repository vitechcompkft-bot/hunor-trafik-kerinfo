"use client";
import { useState, useEffect, useMemo } from "react";
import { Cigarette, Calendar, Clock, RefreshCw } from "lucide-react";
import type { TrafikData } from "@/lib/types";
import { NapiTabla } from "@/components/NapiTabla";
import { HaviTabla } from "@/components/HaviTabla";
import { ForgTrend } from "@/components/ForgTrend";
import { NapiTrafikBarChart } from "@/components/NapiTrafikBarChart";
import { TopTrafikDiagram } from "@/components/TopTrafikDiagram";

const HONAP_NEV = ["", "Január","Február","Március","Április","Május","Június","Július","Augusztus","Szeptember","Október","November","December"];
const BASE_PATH = "";  // Vercel esetén nincs basePath

export default function Home() {
  const [data, setData] = useState<TrafikData | null>(null);
  const [nezet, setNezet] = useState<"napi" | "havi">("napi");
  const [napiKulcs, setNapiKulcs] = useState<string>("");
  const [haviKulcs, setHaviKulcs] = useState<string>("");

  useEffect(() => {
    fetch(`${BASE_PATH}/data/trafik.json`).then(r => r.json()).then((d: TrafikData) => {
      setData(d);
      // Ma kimarad — csak a lezárt napok, alapból az előző napra ugrik
      const ma = new Date().toISOString().slice(0, 10);
      const napokNemMa = d.napok.filter(n => n < ma).sort();
      setNapiKulcs(napokNemMa[napokNemMa.length - 1] || d.utolso_napi);
      setHaviKulcs(d.havi_kulcsok[0] || "");
    });
  }, []);

  const valaszthatoNapok = useMemo(() => {
    if (!data) return [] as string[];
    // Ma kimarad, mert Z-zárás előtti napok félrevezetőek
    const ma = new Date().toISOString().slice(0, 10);
    return [...data.napok].filter(n => n < ma).sort().reverse();
  }, [data]);

  if (!data) return <main className="p-8 text-white/60">Betöltés…</main>;

  const napiSorok = data.napi[napiKulcs] || [];
  const haviSorok = data.havi[haviKulcs] || [];
  const [ev, honap] = haviKulcs.split("-").map(Number);
  const napiNyitva = napiSorok.filter(r => r.forgalom > 0).length;
  const napiOssz = napiSorok.length;

  return (
    <main className="min-h-screen">
      <header className="border-b border-white/10 backdrop-blur bg-white/[0.02] sticky top-0 z-10">
        <div className="mx-auto flex max-w-7xl items-center gap-2 sm:gap-4 px-3 sm:px-6 py-2.5 sm:py-4">
          <div className="rounded-lg sm:rounded-xl bg-brand p-2 sm:p-2.5 text-white shadow-lg shadow-brand/30 shrink-0">
            <Cigarette className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-base sm:text-2xl font-bold text-white tracking-tight leading-tight">Trafik kereskedelmi info</h1>
            <p className="text-[11px] sm:text-sm text-white/70 leading-tight">18 trafik · napi + havi</p>
          </div>
          <div className="text-xs text-white/40 hidden md:flex items-center gap-1.5 shrink-0">
            <RefreshCw className="h-3 w-3" />
            {new Date(data.generated_at).toLocaleString("hu-HU")}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-3 sm:px-6 py-3 sm:py-6 space-y-3 sm:space-y-4">
        <div className="v-card p-3 sm:p-4 flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="inline-flex rounded-lg border border-white/10 bg-white/[0.03] overflow-hidden">
            <button onClick={() => setNezet("napi")}
              className={"v-toggle-btn inline-flex items-center gap-1.5 " + (nezet === "napi" ? "active" : "")}>
              <Clock className="h-4 w-4" />Napi
            </button>
            <button disabled title="Havi nézet: bázis-adat feltöltése után lesz elérhető"
              className="v-toggle-btn inline-flex items-center gap-1.5 border-l border-white/10 opacity-40 cursor-not-allowed">
              <Calendar className="h-4 w-4" />Havi <span className="text-[10px] ml-1">(hamarosan)</span>
            </button>
          </div>

          {nezet === "napi" ? (
            <>
              <label className="text-sm text-white/70">Dátum:</label>
              <select value={napiKulcs} onChange={e => setNapiKulcs(e.target.value)} className="v-input">
                {valaszthatoNapok.map(nap => <option key={nap} value={nap} className="bg-slate-800">{nap}</option>)}
              </select>
              <span className="v-badge v-badge-ok">
                {napiNyitva}/{napiOssz} nyitva
              </span>
            </>
          ) : (
            <>
              <label className="text-sm text-white/70">Hónap:</label>
              <select value={haviKulcs} onChange={e => setHaviKulcs(e.target.value)} className="v-input">
                {data.havi_kulcsok.map(k => {
                  const [y, m] = k.split("-").map(Number);
                  return <option key={k} value={k} className="bg-slate-800">{y}. {HONAP_NEV[m]}</option>;
                })}
              </select>
            </>
          )}
        </div>

        {nezet === "napi" && (
          <>
            <h2 className="text-base sm:text-lg font-semibold text-white">
              Napi forgalom — {napiKulcs}
            </h2>
            <NapiTabla sorok={napiSorok} datum={napiKulcs} />
            <NapiTrafikBarChart sorok={napiSorok} cim={`Napi forgalom trafikonként — ${napiKulcs}`} fname={`napi-forgalom-trafik-${napiKulcs}`} />
            <ForgTrend data={data} valasztottNap={napiKulcs} />
          </>
        )}

        {nezet === "havi" && (
          <>
            <h2 className="text-base sm:text-lg font-semibold text-white">
              Havi összesítő — {ev}. {HONAP_NEV[honap]}
            </h2>
            <HaviTabla sorok={haviSorok} honap={`${ev}. ${HONAP_NEV[honap]}`} />
            <TopTrafikDiagram sorok={haviSorok} cim={`Top trafikok forgalom szerint (${ev}. ${HONAP_NEV[honap]})`} fname={`top-trafik-${haviKulcs}`} />
          </>
        )}

        <footer className="text-center text-xs text-white/30 pt-8">
          Vitech Comp Kft. · HUNOR-COOP Zrt. trafik-kerinfo dashboard
        </footer>
      </div>
    </main>
  );
}
