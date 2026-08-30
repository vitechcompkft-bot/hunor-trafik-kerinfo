"use client";
import { useState, useMemo } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import type { NapiSor } from "@/lib/types";
import { ft, num, pct } from "@/lib/utils";
import { ExportGombok } from "./ExportGombok";
import { exportTableToXlsx, exportTableToPdf, type ExportColumn } from "@/lib/export";

type Rendezes = { oszlop: keyof NapiSor; irany: "asc" | "desc" };

const NAPI_OSZLOPOK: ExportColumn[] = [
  { header: "Trafik", key: "nev", format: "text" },
  { header: "ÁrbevBr", key: "forgalom", format: "ft" },
  { header: "ÁrRésNe", key: "arres_ne", format: "ft" },
  { header: "ÁrRés%", key: "arres_sz", format: "pct" },
  { header: "BlokkDb", key: "vevoszam", format: "num" },
  { header: "ZáróBr", key: "keszlet_br", format: "ft" },
  { header: "Leértössz", key: "leertekeles", format: "ft" },
  { header: "LeírásBr", key: "leiras_br", format: "ft" },
  { header: "EmozgBr", key: "emozg_br", format: "ft" },
  { header: "ÁrrésVeszteség", key: "arres_veszteseg", format: "pct" },
];

export function NapiTabla({ sorok, datum = "" }: { sorok: NapiSor[]; datum?: string }) {
  const [rendez, setRendez] = useState<Rendezes>({ oszlop: "bolt", irany: "asc" });

  const sorbaRendezett = useMemo(() => {
    const s = [...sorok];
    s.sort((a, b) => {
      // Trafik-oszlopnál a bolt-kód szerint rendezünk (008 < 010 < 011 < 013 < 119 < 550)
      const va = rendez.oszlop === "nev" ? a.bolt : (a[rendez.oszlop] as string | number);
      const vb = rendez.oszlop === "nev" ? b.bolt : (b[rendez.oszlop] as string | number);
      if (va < vb) return rendez.irany === "asc" ? -1 : 1;
      if (va > vb) return rendez.irany === "asc" ? 1 : -1;
      return 0;
    });
    return s;
  }, [sorok, rendez]);

  function fejl(kulcs: keyof NapiSor, cim: string, jobbra = true) {
    const active = rendez.oszlop === kulcs;
    return (
      <th
        onClick={() => setRendez(r => ({
          oszlop: kulcs,
          irany: r.oszlop === kulcs && r.irany === "asc" ? "desc" : "asc",
        }))}
        className={`px-2 py-2 cursor-pointer hover:bg-white/[0.06] select-none whitespace-nowrap ${jobbra ? "text-right" : "text-left"}`}
      >
        <span className="inline-flex items-center gap-1">
          {cim}
          {active && (rendez.irany === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
        </span>
      </th>
    );
  }

  const osszForg = sorok.reduce((s, r) => s + r.forgalom, 0);
  const osszVev = sorok.reduce((s, r) => s + r.vevoszam, 0);
  const osszArres = sorok.reduce((s, r) => s + r.arres_ne, 0);
  const osszKesz = sorok.reduce((s, r) => s + r.keszlet_br, 0);
  const osszLeert = sorok.reduce((s, r) => s + r.leertekeles, 0);
  const osszEmozg = sorok.reduce((s, r) => s + r.emozg_br, 0);
  const atlagArresSz = osszForg > 0 ? (osszArres / osszForg * 127) : 0;

  const cim = datum ? `Napi forgalom — ${datum}` : "Napi forgalom";
  const fname = datum ? `trafik-napi-${datum}` : "trafik-napi";

  return (
    <div className="v-card overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-3 py-2 border-b border-white/10">
        <span className="text-xs text-white/60">{sorbaRendezett.length} trafik</span>
        <ExportGombok kind="table"
          onXlsx={() => exportTableToXlsx(sorbaRendezett, NAPI_OSZLOPOK, `${fname}.xlsx`, cim)}
          onPdf={() => exportTableToPdf(sorbaRendezett, NAPI_OSZLOPOK, `${fname}.pdf`, cim)}
        />
      </div>
      <div className="overflow-x-auto">
      <table className="v-table text-sm w-full">
        <thead className="uppercase text-sm">
          <tr>
            {fejl("nev", "Trafik", false)}
            {fejl("forgalom", "ÁrbevBr")}
            {fejl("arres_ne", "ÁrRésNe")}
            {fejl("arres_sz", "ÁrRés%")}
            {fejl("vevoszam", "BlokkDb")}
            {fejl("keszlet_br", "ZáróBr")}
            {fejl("leertekeles", "Leértössz")}
            {fejl("leiras_br", "LeírásBr")}
            {fejl("emozg_br", "EmozgBr")}
            {fejl("arres_veszteseg", "ÁrrésVeszteség")}
          </tr>
        </thead>
        <tbody>
          {sorbaRendezett.map(r => (
            <tr key={r.bolt}>
              <td className="px-2 py-1.5 font-medium whitespace-nowrap">{r.nev}</td>
              <td className="px-2 py-1.5 text-right tabular-nums whitespace-nowrap">{ft(r.forgalom)}</td>
              <td className="px-2 py-1.5 text-right tabular-nums whitespace-nowrap">{ft(r.arres_ne)}</td>
              <td className="px-2 py-1.5 text-right tabular-nums whitespace-nowrap">{r.arres_sz ? pct(r.arres_sz) : "—"}</td>
              <td className="px-2 py-1.5 text-right tabular-nums whitespace-nowrap">{num(r.vevoszam)}</td>
              <td className="px-2 py-1.5 text-right tabular-nums whitespace-nowrap text-white/80">{ft(r.keszlet_br)}</td>
              <td className="px-2 py-1.5 text-right tabular-nums whitespace-nowrap">{ft(r.leertekeles)}</td>
              <td className="px-2 py-1.5 text-right tabular-nums whitespace-nowrap">{ft(r.leiras_br)}</td>
              <td className="px-2 py-1.5 text-right tabular-nums whitespace-nowrap">{ft(r.emozg_br)}</td>
              <td className="px-2 py-1.5 text-right tabular-nums whitespace-nowrap">{r.arres_veszteseg ? r.arres_veszteseg.toFixed(2) + "%" : "—"}</td>
            </tr>
          ))}
          <tr className="row-osszes">
            <td className="px-2 py-2">Összesen</td>
            <td className="px-2 py-2 text-right tabular-nums whitespace-nowrap">{ft(osszForg)}</td>
            <td className="px-2 py-2 text-right tabular-nums whitespace-nowrap">{ft(osszArres)}</td>
            <td className="px-2 py-2 text-right tabular-nums whitespace-nowrap">{pct(atlagArresSz)}</td>
            <td className="px-2 py-2 text-right tabular-nums whitespace-nowrap">{num(osszVev)}</td>
            <td className="px-2 py-2 text-right tabular-nums whitespace-nowrap">{ft(osszKesz)}</td>
            <td className="px-2 py-2 text-right tabular-nums whitespace-nowrap">{ft(osszLeert)}</td>
            <td className="px-2 py-2 text-right tabular-nums whitespace-nowrap">—</td>
            <td className="px-2 py-2 text-right tabular-nums whitespace-nowrap">{ft(osszEmozg)}</td>
            <td className="px-2 py-2 text-right tabular-nums whitespace-nowrap">—</td>
          </tr>
        </tbody>
      </table>
      </div>
    </div>
  );
}
