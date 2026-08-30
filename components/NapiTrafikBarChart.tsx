"use client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LabelList } from "recharts";
import type { NapiSor } from "@/lib/types";

export function NapiTrafikBarChart({ sorok, cim }: { sorok: NapiSor[]; cim: string }) {
  const data = [...sorok]
    .sort((a, b) => b.forgalom - a.forgalom)
    .map(r => ({
      bolt: r.bolt,
      forgalom: Math.round(r.forgalom),
    }));

  return (
    <div className="v-card p-4">
      <h3 className="text-sm font-semibold text-white mb-3">{cim}</h3>
      <ResponsiveContainer width="100%" height={320}>
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
  );
}
