"use client";
import { useState, useMemo } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import type { NapiSor } from "@/lib/types";
import { ft, num, pct } from "@/lib/utils";

type Rendezes = { oszlop: keyof NapiSor; irany: "asc" | "desc" };

export function NapiTabla({ sorok }: { sorok: NapiSor[] }) {
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

  return (
    <div className="v-card overflow-hidden overflow-x-auto">
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
              <td className="px-2 py-1.5 text-right tabular-nums">{ft(r.forgalom)}</td>
              <td className="px-2 py-1.5 text-right tabular-nums">{ft(r.arres_ne)}</td>
              <td className="px-2 py-1.5 text-right tabular-nums">{r.arres_sz ? pct(r.arres_sz) : "—"}</td>
              <td className="px-2 py-1.5 text-right tabular-nums">{num(r.vevoszam)}</td>
              <td className="px-2 py-1.5 text-right tabular-nums text-white/80">{ft(r.keszlet_br)}</td>
              <td className="px-2 py-1.5 text-right tabular-nums">{ft(r.leertekeles)}</td>
              <td className="px-2 py-1.5 text-right tabular-nums">{ft(r.leiras_br)}</td>
              <td className="px-2 py-1.5 text-right tabular-nums">{ft(r.emozg_br)}</td>
              <td className="px-2 py-1.5 text-right tabular-nums">{r.arres_veszteseg ? r.arres_veszteseg.toFixed(2) + "%" : "—"}</td>
            </tr>
          ))}
          <tr className="row-osszes">
            <td className="px-2 py-2">Összesen</td>
            <td className="px-2 py-2 text-right tabular-nums">{ft(osszForg)}</td>
            <td className="px-2 py-2 text-right tabular-nums">{ft(osszArres)}</td>
            <td className="px-2 py-2 text-right tabular-nums">{pct(atlagArresSz)}</td>
            <td className="px-2 py-2 text-right tabular-nums">{num(osszVev)}</td>
            <td className="px-2 py-2 text-right tabular-nums">{ft(osszKesz)}</td>
            <td className="px-2 py-2 text-right tabular-nums">{ft(osszLeert)}</td>
            <td className="px-2 py-2 text-right tabular-nums">—</td>
            <td className="px-2 py-2 text-right tabular-nums">{ft(osszEmozg)}</td>
            <td className="px-2 py-2 text-right tabular-nums">—</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
