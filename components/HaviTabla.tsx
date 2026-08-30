"use client";
import { useState, useMemo } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import type { HaviSor } from "@/lib/types";
import { ft, num, pct } from "@/lib/utils";
import { ExportGombok } from "./ExportGombok";
import { exportTableToXlsx, exportTableToPdf, type ExportColumn } from "@/lib/export";

type Rendezes = { oszlop: keyof HaviSor; irany: "asc" | "desc" };

// Sorrend a látvány szerint: minden ahol van bázis: Bázis → Tény → Idx%
const HAVI_OSZLOPOK: ExportColumn[] = [
  { header: "Trafik", key: "nev", format: "text" },
  { header: "Bázis (Ft)", key: "forgalom_bazis", format: "ft" },
  { header: "ÁrbevBr", key: "forgalom", format: "ft" },
  { header: "ÁrRésNe", key: "arres", format: "ft" },
  { header: "ÁrRés%", key: "arres_szint", format: "pct" },
  { header: "Vevő Db Bázis", key: "vevoszam_bazis", format: "num" },
  { header: "Vevő Db", key: "vevoszam", format: "num" },
  { header: "Készl. Bázis", key: "keszlet_bazis", format: "ft" },
  { header: "ZáróBr", key: "keszlet", format: "ft" },
  { header: "Leértössz", key: "leertekeles", format: "ft" },
  { header: "LeírásBr", key: "leiras_br", format: "ft" },
  { header: "EmozgBr", key: "emozg_br", format: "ft" },
];

// Kiszámított index-mezők neve — külön, csak az exportnál
const IDX_OSZLOPOK = {
  _fidx: "Index %",
  _vidx: "Vevő Idx %",
  _kidx: "Készl. Idx %",
};

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

  function fejl(kulcs: keyof HaviSor, cim: string, jobbra = true, dim = false) {
    const active = rendez.oszlop === kulcs;
    return (
      <th
        onClick={() => setRendez(r => ({
          oszlop: kulcs,
          irany: r.oszlop === kulcs && r.irany === "asc" ? "desc" : "asc",
        }))}
        className={`px-2 py-2 cursor-pointer hover:bg-white/[0.06] select-none whitespace-nowrap ${jobbra ? "text-right" : "text-left"} ${dim ? "text-white/60" : ""}`}
      >
        <span className="inline-flex items-center gap-1">
          {cim}
          {active && (rendez.irany === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
        </span>
      </th>
    );
  }

  const osszForgB = sorok.reduce((s, r) => s + (r.forgalom_bazis || 0), 0);
  const osszForg = sorok.reduce((s, r) => s + r.forgalom, 0);
  const osszVevB = sorok.reduce((s, r) => s + (r.vevoszam_bazis || 0), 0);
  const osszVev = sorok.reduce((s, r) => s + r.vevoszam, 0);
  const osszKeszB = sorok.reduce((s, r) => s + (r.keszlet_bazis || 0), 0);
  const osszKesz = sorok.reduce((s, r) => s + r.keszlet, 0);
  const osszArres = sorok.reduce((s, r) => s + r.arres, 0);
  const osszLeert = sorok.reduce((s, r) => s + r.leertekeles, 0);
  const osszEmozg = sorok.reduce((s, r) => s + r.emozg_br, 0);
  const atlagArresSz = osszForg > 0 ? (osszArres / osszForg * 127) : 0;

  const cim = honap ? `Havi összesítő — ${honap}` : "Havi összesítő";
  const fname = honap ? `trafik-havi-${honap}` : "trafik-havi";

  // Exportba az Idx% is bekerül (bázis-tény-idx sorrendben)
  const exportSorok = sorbaRendezett.map(r => ({
    ...r,
    _fidx: r.forgalom_bazis > 0 ? (r.forgalom / r.forgalom_bazis * 100) : 0,
    _vidx: r.vevoszam_bazis > 0 ? (r.vevoszam / r.vevoszam_bazis * 100) : 0,
    _kidx: r.keszlet_bazis > 0 ? (r.keszlet / r.keszlet_bazis * 100) : 0,
  }));
  const exportOszlopok: ExportColumn[] = [
    HAVI_OSZLOPOK[0],  // Trafik
    HAVI_OSZLOPOK[1],  // Bázis (Ft)
    HAVI_OSZLOPOK[2],  // ÁrbevBr
    { header: IDX_OSZLOPOK._fidx, key: "_fidx", format: "pct" },
    HAVI_OSZLOPOK[3],  // ÁrRésNe
    HAVI_OSZLOPOK[4],  // ÁrRés%
    HAVI_OSZLOPOK[5],  // Vevő Db Bázis
    HAVI_OSZLOPOK[6],  // Vevő Db
    { header: IDX_OSZLOPOK._vidx, key: "_vidx", format: "pct" },
    HAVI_OSZLOPOK[7],  // Készl. Bázis
    HAVI_OSZLOPOK[8],  // ZáróBr
    { header: IDX_OSZLOPOK._kidx, key: "_kidx", format: "pct" },
    HAVI_OSZLOPOK[9],  // Leértössz
    HAVI_OSZLOPOK[10], // LeírásBr
    HAVI_OSZLOPOK[11], // EmozgBr
  ];

  // Színkód segéd
  function idxCls(val: number, gyanus: boolean) {
    return gyanus ? "text-amber-400" : val >= 100 ? "text-emerald-400" : val > 0 ? "text-red-400" : "text-white/40";
  }

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
            {fejl("forgalom_bazis", "Bázis", true, true)}
            {fejl("forgalom", "ÁrbevBr")}
            <th className="px-2 py-2 text-right whitespace-nowrap">Index %</th>
            {fejl("arres", "ÁrRésNe")}
            {fejl("arres_szint", "ÁrRés%")}
            {fejl("vevoszam_bazis", "Vevő Db Bázis", true, true)}
            {fejl("vevoszam", "Vevő Db")}
            <th className="px-2 py-2 text-right whitespace-nowrap">Vevő Idx %</th>
            {fejl("keszlet_bazis", "Készl. Bázis", true, true)}
            {fejl("keszlet", "ZáróBr")}
            <th className="px-2 py-2 text-right whitespace-nowrap">Készl. Idx %</th>
            {fejl("leertekeles", "Leértössz")}
            {fejl("leiras_br", "LeírásBr")}
            {fejl("emozg_br", "EmozgBr")}
          </tr>
        </thead>
        <tbody>
          {sorbaRendezett.map(r => {
            const fidx = r.forgalom_bazis > 0 ? (r.forgalom / r.forgalom_bazis * 100) : 0;
            const fgy = fidx > 200 || (fidx > 0 && fidx < 50);
            const vidx = r.vevoszam_bazis > 0 ? (r.vevoszam / r.vevoszam_bazis * 100) : 0;
            const vgy = vidx > 200 || (vidx > 0 && vidx < 50);
            const kidx = r.keszlet_bazis > 0 ? (r.keszlet / r.keszlet_bazis * 100) : 0;
            const kgy = kidx > 200 || (kidx > 0 && kidx < 50);
            return (
            <tr key={r.bolt}>
              <td className="px-2 py-1.5 font-medium whitespace-nowrap">{r.nev}</td>
              <td className="px-2 py-1.5 text-right tabular-nums whitespace-nowrap text-white/60" title={fgy ? "Gyanús bázis-adat" : ""}>{r.forgalom_bazis > 0 ? ft(r.forgalom_bazis) : "—"}</td>
              <td className="px-2 py-1.5 text-right tabular-nums whitespace-nowrap">{ft(r.forgalom)}</td>
              <td className={`px-2 py-1.5 text-right tabular-nums whitespace-nowrap font-semibold ${idxCls(fidx, fgy)}`}>{fidx > 0 ? (fgy ? "⚠ " : "") + pct(fidx) : "—"}</td>
              <td className="px-2 py-1.5 text-right tabular-nums whitespace-nowrap">{ft(r.arres)}</td>
              <td className="px-2 py-1.5 text-right tabular-nums whitespace-nowrap">{r.arres_szint ? pct(r.arres_szint) : "—"}</td>
              <td className="px-2 py-1.5 text-right tabular-nums whitespace-nowrap text-white/60">{r.vevoszam_bazis > 0 ? num(r.vevoszam_bazis) : "—"}</td>
              <td className="px-2 py-1.5 text-right tabular-nums whitespace-nowrap">{num(r.vevoszam)}</td>
              <td className={`px-2 py-1.5 text-right tabular-nums whitespace-nowrap font-semibold ${idxCls(vidx, vgy)}`}>{vidx > 0 ? (vgy ? "⚠ " : "") + pct(vidx) : "—"}</td>
              <td className="px-2 py-1.5 text-right tabular-nums whitespace-nowrap text-white/60">{r.keszlet_bazis > 0 ? ft(r.keszlet_bazis) : "—"}</td>
              <td className="px-2 py-1.5 text-right tabular-nums whitespace-nowrap">{ft(r.keszlet)}</td>
              <td className={`px-2 py-1.5 text-right tabular-nums whitespace-nowrap font-semibold ${idxCls(kidx, kgy)}`}>{kidx > 0 ? (kgy ? "⚠ " : "") + pct(kidx) : "—"}</td>
              <td className="px-2 py-1.5 text-right tabular-nums whitespace-nowrap">{ft(r.leertekeles)}</td>
              <td className="px-2 py-1.5 text-right tabular-nums whitespace-nowrap">{ft(r.leiras_br)}</td>
              <td className="px-2 py-1.5 text-right tabular-nums whitespace-nowrap">{ft(r.emozg_br)}</td>
            </tr>
            );
          })}
          <tr className="row-osszes">
            <td className="px-2 py-2">Összesen</td>
            <td className="px-2 py-2 text-right tabular-nums whitespace-nowrap text-white/70">{osszForgB > 0 ? ft(osszForgB) : "—"}</td>
            <td className="px-2 py-2 text-right tabular-nums whitespace-nowrap">{ft(osszForg)}</td>
            {(() => {
              const idx = osszForgB > 0 ? (osszForg / osszForgB * 100) : 0;
              return <td className={`px-2 py-2 text-right tabular-nums whitespace-nowrap ${idxCls(idx, false)}`}>{idx > 0 ? pct(idx) : "—"}</td>;
            })()}
            <td className="px-2 py-2 text-right tabular-nums whitespace-nowrap">{ft(osszArres)}</td>
            <td className="px-2 py-2 text-right tabular-nums whitespace-nowrap">{pct(atlagArresSz)}</td>
            <td className="px-2 py-2 text-right tabular-nums whitespace-nowrap text-white/70">{osszVevB > 0 ? num(osszVevB) : "—"}</td>
            <td className="px-2 py-2 text-right tabular-nums whitespace-nowrap">{num(osszVev)}</td>
            {(() => {
              const idx = osszVevB > 0 ? (osszVev / osszVevB * 100) : 0;
              return <td className={`px-2 py-2 text-right tabular-nums whitespace-nowrap ${idxCls(idx, false)}`}>{idx > 0 ? pct(idx) : "—"}</td>;
            })()}
            <td className="px-2 py-2 text-right tabular-nums whitespace-nowrap text-white/70">{osszKeszB > 0 ? ft(osszKeszB) : "—"}</td>
            <td className="px-2 py-2 text-right tabular-nums whitespace-nowrap">{ft(osszKesz)}</td>
            {(() => {
              const idx = osszKeszB > 0 ? (osszKesz / osszKeszB * 100) : 0;
              return <td className={`px-2 py-2 text-right tabular-nums whitespace-nowrap ${idxCls(idx, false)}`}>{idx > 0 ? pct(idx) : "—"}</td>;
            })()}
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
