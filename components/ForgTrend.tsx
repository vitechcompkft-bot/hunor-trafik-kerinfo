"use client";
import { useRef } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from "recharts";
import type { TrafikData } from "@/lib/types";
import { ExportGombok } from "./ExportGombok";
import { exportChartToPng, exportChartToPdf } from "@/lib/export";

const HONAP_NEV = ["", "Január","Február","Március","Április","Május","Június","Július","Augusztus","Szeptember","Október","November","December"];

export function ForgTrend({ data, valasztottNap }: { data: TrafikData; valasztottNap: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const ma = new Date().toISOString().slice(0, 10);
  const honapPrefix = valasztottNap.slice(0, 7);
  const napokEbbenAHoban = [...data.napok]
    .filter(n => n.startsWith(honapPrefix) && n < ma)
    .sort();
  const chartData = napokEbbenAHoban.map(nap => {
    const sorok = data.napi[nap] || [];
    const ossz = sorok.reduce((s, r) => s + r.forgalom, 0);
    return { nap: nap.slice(8), forgalom: Math.round(ossz) };
  });
  const [ev, ho] = honapPrefix.split("-").map(Number);
  const cim = `Havi összforgalmi trend — ${ev}. ${HONAP_NEV[ho]} (${napokEbbenAHoban.length} nap)`;
  const fname = `havi-osszforgalmi-trend-${honapPrefix}`;

  return (
    <div className="v-card p-3 sm:p-4" ref={ref}>
      <div className="flex items-center justify-between gap-2 sm:gap-3 mb-3">
        <h3 className="text-xs sm:text-sm font-semibold text-white leading-tight">{cim}</h3>
        <ExportGombok kind="chart"
          onPng={() => ref.current && exportChartToPng(ref.current, `${fname}.png`)}
          onPdf={() => ref.current && exportChartToPdf(ref.current, `${fname}.pdf`, cim)}
        />
      </div>
      <div className="h-[220px] sm:h-[280px] landscape:max-md:h-[200px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 15, bottom: 5, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
          <XAxis dataKey="nap" tick={{ fontSize: 11, fill: "rgba(255,255,255,0.6)" }} />
          <YAxis tick={{ fontSize: 11, fill: "rgba(255,255,255,0.6)" }} tickFormatter={(v) => (v/1_000_000).toFixed(0) + "M"} />
          <Tooltip formatter={(v) => Number(v).toLocaleString("hu-HU") + " Ft"} contentStyle={{ background: "#0D2540", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8 }} />
          <Legend wrapperStyle={{ color: "rgba(255,255,255,0.8)" }} />
          <Line type="monotone" dataKey="forgalom" stroke="#1A73E8" strokeWidth={2.5} dot={{ r: 3, fill: "#1A73E8" }} name="Össz-forgalom" />
        </LineChart>
      </ResponsiveContainer>
      </div>
    </div>
  );
}
