"use client";
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from "recharts";
import type { TrafikData } from "@/lib/types";

export function ForgTrend({ data }: { data: TrafikData }) {
  // Csak a mai előtti napok (Z-zárt), utolsó 30
  const ma = new Date().toISOString().slice(0, 10);
  const utNapok = [...data.napok].filter(n => n < ma).sort().slice(-30);
  const chartData = utNapok.map(nap => {
    const sorok = data.napi[nap] || [];
    const ossz = sorok.reduce((s, r) => s + r.forgalom, 0);
    return {
      nap: nap.slice(5),  // MM-DD
      forgalom: Math.round(ossz),
    };
  });

  return (
    <div className="v-card p-4">
      <h3 className="text-sm font-semibold text-white mb-3">Napi összforgalom trend (utolsó 30 nap)</h3>
      <ResponsiveContainer width="100%" height={280}>
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
  );
}
