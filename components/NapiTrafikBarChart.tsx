"use client";
import { useRef } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LabelList } from "recharts";
import type { NapiSor } from "@/lib/types";
import { ExportGombok } from "./ExportGombok";
import { exportChartToPng, exportChartToPdf } from "@/lib/export";

export function NapiTrafikBarChart({ sorok, cim, fname = "napi-forgalom-trafik" }: { sorok: NapiSor[]; cim: string; fname?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const data = [...sorok]
    .sort((a, b) => b.forgalom - a.forgalom)
    .map(r => ({ bolt: r.bolt, forgalom: Math.round(r.forgalom) }));

  return (
    <div className="v-card p-3 sm:p-4" ref={ref}>
      <div className="flex items-center justify-between gap-2 sm:gap-3 mb-3">
        <h3 className="text-xs sm:text-sm font-semibold text-white leading-tight">{cim}</h3>
        <ExportGombok kind="chart"
          onPng={() => ref.current && exportChartToPng(ref.current, `${fname}.png`)}
          onPdf={() => ref.current && exportChartToPdf(ref.current, `${fname}.pdf`, cim)}
        />
      </div>
      <div className="h-[240px] sm:h-[320px] landscape:max-md:h-[220px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 15, bottom: 5, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
          <XAxis dataKey="bolt" tick={{ fontSize: 11, fill: "rgba(255,255,255,0.7)" }} />
          <YAxis tick={{ fontSize: 11, fill: "rgba(255,255,255,0.7)" }} tickFormatter={(v) => (v/1_000_000).toFixed(1) + "M"} />
          <Tooltip
            formatter={(v) => Number(v).toLocaleString("hu-HU") + " Ft"}
            contentStyle={{ background: "#0D2540", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8 }}
            cursor={{ fill: "rgba(26,115,232,0.1)" }}
          />
          <Bar dataKey="forgalom" fill="#1A73E8" radius={[4, 4, 0, 0]}>
            <LabelList
              dataKey="forgalom"
              position="top"
              formatter={(v) => { const n = Number(v) || 0; return n > 0 ? (n/1_000_000).toFixed(1) + "M" : ""; }}
              style={{ fill: "rgba(255,255,255,0.85)", fontSize: 10 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      </div>
    </div>
  );
}
