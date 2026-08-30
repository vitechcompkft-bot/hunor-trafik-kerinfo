"use client";
import { useState, useMemo } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import type { HaviSor } from "@/lib/types";
import { ft, num, pct } from "@/lib/utils";

type Rendezes = { oszlop: keyof HaviSor; irany: "asc" | "desc" };

export function HaviTabla({ sorok }: { sorok: HaviSor[] }) {
  const [rendez, setRendez] = useState<Rendezes>({ oszlop: "bolt", irany: "asc" });

  const sorbaRendezett = useMemo(() => {
    const s = [...sorok];
    s.sort((a, b) => {
      const va = a[rendez.oszlop] as string | number;
      const vb = b[rendez.oszlop] as string | number;
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

  return (
    <div className="v-card overflow-hidden overflow-x-auto">
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
              <td className="px-2 py-1.5 text-right tabular-nums">{ft(r.forgalom)}</td>
              <td className="px-2 py-1.5 text-right tabular-nums text-white/50" title={gyanus ? "Gyanús bázis-adat (részleges)" : ""}>{r.forgalom_bazis > 0 ? ft(r.forgalom_bazis) : "—"}</td>
              <td className={`px-2 py-1.5 text-right tabular-nums font-semibold ${idxCls}`} title={gyanus ? "Bázis-adat gyanús" : ""}>{idx > 0 ? (gyanus ? "⚠ " : "") + pct(idx) : "—"}</td>
              <td className="px-2 py-1.5 text-right tabular-nums">{ft(r.arres)}</td>
              <td className="px-2 py-1.5 text-right tabular-nums">{r.arres_szint ? pct(r.arres_szint) : "—"}</td>
              <td className="px-2 py-1.5 text-right tabular-nums">{num(r.vevoszam)}</td>
              <td className="px-2 py-1.5 text-right tabular-nums text-white/60">{ft(r.keszlet)}</td>
              <td className="px-2 py-1.5 text-right tabular-nums">{ft(r.leertekeles)}</td>
              <td className="px-2 py-1.5 text-right tabular-nums">{ft(r.leiras_br)}</td>
              <td className="px-2 py-1.5 text-right tabular-nums">{ft(r.emozg_br)}</td>
            </tr>
            );
          })}
          <tr className="row-osszes">
            <td className="px-2 py-2">Összesen</td>
            <td className="px-2 py-2 text-right tabular-nums">{ft(osszForg)}</td>
            {(() => {
              const osszBazis = sorok.reduce((s,r) => s + (r.forgalom_bazis || 0), 0);
              const osszIdx = osszBazis > 0 ? (osszForg / osszBazis * 100) : 0;
              const cls = osszIdx >= 100 ? "text-emerald-400" : osszIdx > 0 ? "text-red-400" : "text-white/40";
              return <>
                <td className="px-2 py-2 text-right tabular-nums text-white/70">{osszBazis > 0 ? ft(osszBazis) : "—"}</td>
                <td className={`px-2 py-2 text-right tabular-nums ${cls}`}>{osszIdx > 0 ? pct(osszIdx) : "—"}</td>
              </>;
            })()}
            <td className="px-2 py-2 text-right tabular-nums">{ft(osszArres)}</td>
            <td className="px-2 py-2 text-right tabular-nums">{pct(atlagArresSz)}</td>
            <td className="px-2 py-2 text-right tabular-nums">{num(osszVev)}</td>
            <td className="px-2 py-2 text-right tabular-nums">{ft(osszKesz)}</td>
            <td className="px-2 py-2 text-right tabular-nums">{ft(osszLeert)}</td>
            <td className="px-2 py-2 text-right tabular-nums">—</td>
            <td className="px-2 py-2 text-right tabular-nums">{ft(osszEmozg)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
