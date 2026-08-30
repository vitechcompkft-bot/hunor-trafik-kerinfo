"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Cigarette, Lock } from "lucide-react";

function LoginForm() {
  const params = useSearchParams();
  const from = params.get("from") || "/";
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    // Ha már be van jelentkezve, ne dobja ki
    document.title = "Belépés · Trafik";
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setBusy(true);
    const r = await fetch("/api/auth", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ pin, from }),
    });
    setBusy(false);
    if (r.ok) {
      const j = await r.json();
      window.location.href = j.redirect || "/";
    } else {
      const j = await r.json().catch(() => ({}));
      setErr(j.error || "Hibás PIN");
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={submit} className="v-card p-6 sm:p-8 max-w-sm w-full space-y-5">
        <div className="flex items-center gap-3 justify-center">
          <div className="rounded-xl bg-brand p-2.5 text-white shadow-lg shadow-brand/30">
            <Cigarette className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-white leading-tight">Trafik kereskedelmi info</h1>
            <p className="text-xs text-white/60">HUNOR-COOP Zrt.</p>
          </div>
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm text-white/80"><Lock className="h-4 w-4" />Belépési PIN</label>
          <input
            type="password" autoFocus autoComplete="off" inputMode="numeric"
            value={pin} onChange={e => setPin(e.target.value)}
            placeholder="••••" className="v-input w-full text-center tracking-widest text-lg"
          />
        </div>

        {err && <p className="rounded-md border border-red-400/40 bg-red-400/10 px-3 py-2 text-sm text-red-100 text-center">{err}</p>}

        <button disabled={busy || !pin} className="w-full rounded-lg bg-brand hover:bg-brand/90 disabled:opacity-50 text-white font-semibold py-2.5">
          {busy ? "Belépés..." : "Belépés"}
        </button>

        <p className="text-xs text-white/40 text-center">A PIN-t az adminisztrátortól kapja meg.</p>
      </form>
    </main>
  );
}

export default function LoginPage() {
  return <Suspense fallback={<main className="min-h-screen" />}><LoginForm /></Suspense>;
}
