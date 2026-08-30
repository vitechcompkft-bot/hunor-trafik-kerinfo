"use client";
import { useState, useMemo } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import type { HaviSor } from "@/lib/types";
import { ft, num, pct } from "@/lib/utils";
import { ExportGombok } from "./ExportGombok";
import { exportTableToXlsx, exportTableToPdf, type ExportColumn } from "@/lib/export";

type Rendezes = { oszlop: keyof HaviSor; irany: "asc" | "desc" };

const HAVI_OSZLOPOK: ExportColumn[] = [
  { header: "Trafik", key: "nev", format: "text" },
  { header: "ÁrbevBr", key: "forgalom", format: "ft" },
  { header: "Bázis", key: "forgalom_bazis", format: "ft" },
  { header: "ÁrRésNe", key: "arres", format: "ft" },
  { header: "ÁrRés%", key: "arres_szint", format: "pct" },
  { header: "BlokkDb", key: "vevoszam", format: "num" },
  { header: "BlokkDb Bázis", key: "vevoszam_bazis", format: "num" },
  { header: "ZáróBr", key: "keszlet", format: "ft" },
  { header: "Leértössz", key: "leertekeles", format: "ft" },
  { header: "LeírásBr", key: "leiras_br", format: "ft" },
  { header: "EmozgBr", key: "emozg_br", format: "ft" },
];

export function HaviTabla({ sorok, honap = "" }: { sorok: HaviSor[]; honap?: string }) {
  const [rendez, setRendez] = useState<Rendezes>({ oszlop: "bolt", irany: "asc" });

  const sorbaRendezett = useMemo(() => {
    const s = [...sorok];
    s.sort((a, b) => {
      const va = rendez.oszlop === "nev" ? a.bolt : (a[rendez.oszlop] as string | number);
      const vb = rendez.oszlop === "nev" ? b.bolt : (b[rendez.oszlop] as string | number);
      if (va < vb) return rendez.irany === "asc" ? -1 : 1;
      if (va > vb) return rendez.irany === "asc" ? 1 : -1;
      return 0;
    });
    return s;
  }, [sorok, rendez]);

  function fejl(kulcs: keyof HaviSor, cim: string, jobbra = true) {
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
  const osszKesz = sorok.reduce((s, r) => s + r.keszlet, 0);
  const osszArres = sorok.reduce((s, r) => s + r.arres, 0);
  const osszLeert = sorok.reduce((s, r) => s + r.leertekeles, 0);
  const osszEmozg = sorok.reduce((s, r) => s + r.emozg_br, 0);
  const atlagArresSz = osszForg > 0 ? (osszArres / osszForg * 127) : 0;

  const cim = honap ? `Havi összesítő — ${honap}` : "Havi összesítő";
  const fname = honap ? `trafik-havi-${honap}` : "trafik-havi";

  // Az exportált sorokba írjuk hozzá az Index%-ot (forgalom + vevőszám)
  const exportSorok = sorbaRendezett.map(r => ({
    ...r,
    _index: r.forgalom_bazis > 0 ? (r.forgalom / r.forgalom_bazis * 100) : 0,
    _vidx: r.vevoszam_bazis > 0 ? (r.vevoszam / r.vevoszam_bazis * 100) : 0,
  }));
  const exportOszlopok: ExportColumn[] = [
    ...HAVI_OSZLOPOK.slice(0, 3),  // Trafik, ÁrbevBr, Bázis
    { header: "Index %", key: "_index", format: "pct" },
    ...HAVI_OSZLOPOK.slice(3, 7),  // ÁrRésNe, ÁrRés%, BlokkDb, BlokkDb Bázis
    { header: "Bl. Idx %", key: "_vidx", format: "pct" },
    ...HAVI_OSZLOPOK.slice(7),
  ];

  return (
    <div className="v-card overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-3 py-2 border-b border-white/10">
        <span className="text-xs text-white/60">{sorbaRendezett.length} trafik</span>
        <ExportGombok kind="table"
          onXlsx={() => exportTableToXlsx(exportSorok, exportOszlopok, `${fname}.xlsx`, cim)}
          onPdf={() => exportTableToPdf(exportSorok, exportOszlopok, `${fname}.pdf`, cim)}
        />
      </div>
      <div className="overflow-x-auto">
      <table className="v-table text-sm w-full">
        <thead className="uppercase text-sm">
          <tr>
            {fejl("nev", "Trafik", false)}
            {fejl("forgalom", "ÁrbevBr")}
            {fejl("forgalom_bazis", "Bázis")}
            <th className="px-2 py-2 text-right whitespace-nowrap">Index %</th>
            {fejl("arres", "ÁrRésNe")}
            {fejl("arres_szint", "ÁrRés%")}
            {fejl("vevoszam", "BlokkDb")}
            {fejl("vevoszam_bazis", "Bl. Bázis")}
            <th className="px-2 py-2 text-right whitespace-nowrap">Bl. Idx %</th>
            {fejl("keszlet", "ZáróBr")}
            {fejl("leertekeles", "Leértössz")}
            {fejl("leiras_br", "LeírásBr")}
            {fejl("emozg_br", "EmozgBr")}
          </tr>
        </thead>
        <tbody>
          {sorbaRendezett.map(r => {
            const idx = r.forgalom_bazis > 0 ? (r.forgalom / r.forgalom_bazis * 100) : 0;
            // Gyanús bázis: ha az arány >200% vagy <50%, akkor valszeg részleges/hibás adat
            const gyanus = idx > 200 || (idx > 0 && idx < 50);
            const idxCls = gyanus ? "text-amber-400" : idx >= 100 ? "text-emerald-400" : idx > 0 ? "text-red-400" : "text-white/40";
            return (
            <tr key={r.bolt}>
              <td className="px-2 py-1.5 font-medium whitespace-nowrap">{r.nev}</td>
              <td className="px-2 py-1.5 text-right tabular-nums whitespace-nowrap">{ft(r.forgalom)}</td>
              <td className="px-2 py-1.5 text-right tabular-nums whitespace-nowrap text-white/50" title={gyanus ? "Gyanús bázis-adat (részleges)" : ""}>{r.forgalom_bazis > 0 ? ft(r.forgalom_bazis) : "—"}</td>
              <td className={`px-2 py-1.5 text-right tabular-nums whitespace-nowrap font-semibold ${idxCls}`} title={gyanus ? "Bázis-adat gyanús" : ""}>{idx > 0 ? (gyanus ? "⚠ " : "") + pct(idx) : "—"}</td>
              <td className="px-2 py-1.5 text-right tabular-nums whitespace-nowrap">{ft(r.arres)}</td>
              <td className="px-2 py-1.5 text-right tabular-nums whitespace-nowrap">{r.arres_szint ? pct(r.arres_szint) : "—"}</td>
              <td className="px-2 py-1.5 text-right tabular-nums whitespace-nowrap">{num(r.vevoszam)}</td>
              <td className="px-2 py-1.5 text-right tabular-nums text-white/50 whitespace-nowrap">{r.vevoszam_bazis > 0 ? num(r.vevoszam_bazis) : "—"}</td>
              {(() => {
                const bidx = r.vevoszam_bazis > 0 ? (r.vevoszam / r.vevoszam_bazis * 100) : 0;
                const bgyanus = bidx > 200 || (bidx > 0 && bidx < 50);
                const bcls = bgyanus ? "text-amber-400" : bidx >= 100 ? "text-emerald-400" : bidx > 0 ? "text-red-400" : "text-white/40";
                return <td className={`px-2 py-1.5 text-right tabular-nums font-semibold whitespace-nowrap ${bcls}`}>{bidx > 0 ? (bgyanus ? "⚠ " : "") + pct(bidx) : "—"}</td>;
              })()}
              <td className="px-2 py-1.5 text-right tabular-nums whitespace-nowrap text-white/60">{ft(r.keszlet)}</td>
              <td className="px-2 py-1.5 text-right tabular-nums whitespace-nowrap">{ft(r.leertekeles)}</td>
              <td className="px-2 py-1.5 text-right tabular-nums whitespace-nowrap">{ft(r.leiras_br)}</td>
              <td className="px-2 py-1.5 text-right tabular-nums whitespace-nowrap">{ft(r.emozg_br)}</td>
            </tr>
            );
          })}
          <tr className="row-osszes">
            <td className="px-2 py-2">Összesen</td>
            <td className="px-2 py-2 text-right tabular-nums whitespace-nowrap">{ft(osszForg)}</td>
            {(() => {
              const osszBazis = sorok.reduce((s,r) => s + (r.forgalom_bazis || 0), 0);
              const osszIdx = osszBazis > 0 ? (osszForg / osszBazis * 100) : 0;
              const cls = osszIdx >= 100 ? "text-emerald-400" : osszIdx > 0 ? "text-red-400" : "text-white/40";
              return <>
                <td className="px-2 py-2 text-right tabular-nums whitespace-nowrap text-white/70">{osszBazis > 0 ? ft(osszBazis) : "—"}</td>
                <td className={`px-2 py-2 text-right tabular-nums whitespace-nowrap ${cls}`}>{osszIdx > 0 ? pct(osszIdx) : "—"}</td>
              </>;
            })()}
            <td className="px-2 py-2 text-right tabular-nums whitespace-nowrap">{ft(osszArres)}</td>
            <td className="px-2 py-2 text-right tabular-nums whitespace-nowrap">{pct(atlagArresSz)}</td>
            <td className="px-2 py-2 text-right tabular-nums whitespace-nowrap">{num(osszVev)}</td>
            {(() => {
              const osszVevB = sorok.reduce((s, r) => s + (r.vevoszam_bazis || 0), 0);
              const bidx = osszVevB > 0 ? (osszVev / osszVevB * 100) : 0;
              const bcls = bidx >= 100 ? "text-emerald-400" : bidx > 0 ? "text-red-400" : "text-white/40";
              return <>
                <td className="px-2 py-2 text-right tabular-nums whitespace-nowrap text-white/70">{osszVevB > 0 ? num(osszVevB) : "—"}</td>
                <td className={`px-2 py-2 text-right tabular-nums whitespace-nowrap ${bcls}`}>{bidx > 0 ? pct(bidx) : "—"}</td>
              </>;
            })()}
            <td className="px-2 py-2 text-right tabular-nums whitespace-nowrap">{ft(osszKesz)}</td>
            <td className="px-2 py-2 text-right tabular-nums whitespace-nowrap">{ft(osszLeert)}</td>
            <td className="px-2 py-2 text-right tabular-nums whitespace-nowrap">—</td>
            <td className="px-2 py-2 text-right tabular-nums whitespace-nowrap">{ft(osszEmozg)}</td>
          </tr>
        </tbody>
      </table>
      </div>
    </div>
  );
}
