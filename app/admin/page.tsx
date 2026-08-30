"use client";
import { useEffect, useRef, useState } from "react";
import { Lock, Mail, Send, ArrowLeft, X, Plus, CheckCircle2 } from "lucide-react";

type Cfg = { emails: string[]; ora: number; aktiv: boolean };

export default function AdminPage() {
  const [pin, setPin] = useState("");
  const [logged, setLogged] = useState(false);
  const [cfg, setCfg] = useState<Cfg | null>(null);
  const [newEmail, setNewEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [savedAt, setSavedAt] = useState<number>(0);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const lastSavedRef = useRef<string>("");

  // 1) Automatikus próbálkozás cookie-val (ha ADMIN_PIN-nel léptél be, ez azonnal átenged)
  // 2) Ha az nem sikerül, kéri az admin PIN-t
  useEffect(() => {
    (async () => {
      const r = await fetch("/api/admin/config", { headers: {} });
      if (r.ok) {
        const data: Cfg = await r.json();
        setCfg(data);
        lastSavedRef.current = JSON.stringify(data);
        setLogged(true);
      }
    })();
  }, []);

  async function tryLogin(pinTry: string) {
    setErr(null);
    const r = await fetch("/api/admin/config", { headers: { "x-admin-pin": pinTry } });
    if (r.ok) {
      const data: Cfg = await r.json();
      setCfg(data);
      lastSavedRef.current = JSON.stringify(data);
      setLogged(true);
      sessionStorage.setItem("admin-pin", pinTry);
    } else {
      setErr("Hibás PIN");
      sessionStorage.removeItem("admin-pin");
    }
  }

  // Auto-save: minden változás után 400ms múlva menti (debounced)
  useEffect(() => {
    if (!cfg) return;
    const cur = JSON.stringify(cfg);
    if (cur === lastSavedRef.current) return;
    const t = setTimeout(async () => {
      const r = await fetch("/api/admin/config", {
        method: "PUT",
        headers: { "content-type": "application/json", ...(pin ? { "x-admin-pin": pin } : {}) },
        body: cur,
      });
      if (r.ok) {
        lastSavedRef.current = cur;
        setSavedAt(Date.now());
        setErr(null);
      } else {
        const j = await r.json().catch(() => ({}));
        setErr(j.error || "Nem sikerült elmenteni");
      }
    }, 400);
    return () => clearTimeout(t);
  }, [cfg, pin]);

  function addEmail() {
    const e = newEmail.trim();
    if (!e || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) { setErr("Érvénytelen email-cím"); return; }
    if (cfg && cfg.emails.includes(e)) { setErr("Ez már be van állítva"); return; }
    setCfg(c => c && { ...c, emails: [...c.emails, e] });
    setNewEmail(""); setErr(null);
  }
  function removeEmail(e: string) { setCfg(c => c && { ...c, emails: c.emails.filter(x => x !== e) }); }

  async function testSend() {
    if (!cfg?.emails.length) { setErr("Nincs email-cím beállítva"); return; }
    setBusy(true); setMsg(null); setErr(null);
    const r = await fetch("/api/admin/test-send", {
      method: "POST",
      headers: { "content-type": "application/json", ...(pin ? { "x-admin-pin": pin } : {}) },
      body: JSON.stringify({ emails: cfg.emails }),
    });
    setBusy(false);
    const j = await r.json();
    if (r.ok && j.ok) setMsg(`Teszt-küldés sikerült — ${j.message}`); else setErr(j.message || j.error || "Hiba");
  }

  if (!logged) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <form onSubmit={e => { e.preventDefault(); tryLogin(pin); }} className="v-card p-6 max-w-sm w-full space-y-4">
          <div className="flex items-center gap-2 text-white">
            <Lock className="h-5 w-5" /><h1 className="text-lg font-bold">Admin belépés</h1>
          </div>
          <input type="password" autoFocus value={pin} onChange={e => setPin(e.target.value)} placeholder="PIN" className="v-input w-full" />
          {err && <p className="text-red-400 text-sm">{err}</p>}
          <button className="w-full rounded-lg bg-brand hover:bg-brand/90 text-white font-semibold py-2.5">Belépés</button>
          <a href="/" className="text-xs text-white/60 hover:text-white/90 flex items-center gap-1 justify-center"><ArrowLeft className="h-3 w-3" />Vissza a dashboardra</a>
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <header className="border-b border-white/10 backdrop-blur bg-white/[0.02]">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 sm:px-6 py-3 sm:py-4">
          <a href="/" className="text-white/70 hover:text-white flex items-center gap-1 text-sm"><ArrowLeft className="h-4 w-4" />Vissza</a>
          <h1 className="flex-1 text-lg sm:text-xl font-bold text-white">Admin · Napi email-riport</h1>
          {savedAt > 0 && Date.now() - savedAt < 3000 && (
            <span className="inline-flex items-center gap-1 text-xs text-emerald-400"><CheckCircle2 className="h-3.5 w-3.5" />Elmentve</span>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-5 space-y-4">
        <div className="v-card p-4 sm:p-5 space-y-4">
          <div className="flex items-center gap-2 text-white/85 font-semibold">
            <Mail className="h-4 w-4" />Címzettek
          </div>
          <div className="space-y-2">
            {cfg?.emails.length === 0 && <p className="text-sm text-white/50 italic">Még nincs beállított email-cím.</p>}
            {cfg?.emails.map(e => (
              <div key={e} className="flex items-center gap-2 bg-white/[0.04] border border-white/10 rounded-md px-3 py-2">
                <span className="flex-1 text-sm text-white/90 break-all">{e}</span>
                <button onClick={() => removeEmail(e)} className="text-white/50 hover:text-red-400" aria-label="Törlés"><X className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addEmail(); } }} placeholder="valaki@peldaul.hu" className="v-input flex-1" />
            <button onClick={addEmail} className="inline-flex items-center gap-1 rounded-md border border-white/15 bg-white/[0.06] hover:bg-white/[0.12] px-3 py-1.5 text-sm text-white"><Plus className="h-4 w-4" />Hozzáadás</button>
          </div>
        </div>

        <div className="v-card p-4 sm:p-5 space-y-3">
          <div className="flex items-center gap-2 text-white/85 font-semibold">Időzítés</div>
          <label className="flex items-center gap-2 text-sm text-white/85">
            <input type="checkbox" checked={cfg?.aktiv || false} onChange={e => setCfg(c => c && { ...c, aktiv: e.target.checked })} className="h-4 w-4 accent-brand" />
            Automatikus napi email-küldés bekapcsolva
          </label>
          <div className="flex items-center gap-3">
            <label className="text-sm text-white/85">Küldés időpontja:</label>
            <select value={cfg?.ora ?? 4} onChange={e => setCfg(c => c && { ...c, ora: Number(e.target.value) })} className="v-input">
              <option value={4} className="bg-slate-800">Reggel 6:00 (magyar idő)</option>
              <option value={6} className="bg-slate-800">Reggel 8:00 (magyar idő)</option>
            </select>
          </div>
          <p className="text-xs text-white/50">
            A rendszer minden nap a beállított időpontban küld egy emailt a beállított címekre az előző napi trafik-adatokkal (XLSX-melléklet). További időpontok Vercel Pro csomaggal.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <button disabled={busy || !cfg?.emails.length} onClick={testSend} className="inline-flex items-center gap-2 rounded-lg bg-brand hover:bg-brand/90 text-white font-semibold px-4 py-2 disabled:opacity-40"><Send className="h-4 w-4" />Teszt-küldés most</button>
          <button onClick={async () => {
              setBusy(true); setMsg(null); setErr(null);
              const r = await fetch("/api/admin/diag", { headers: { ...(pin ? { "x-admin-pin": pin } : {}) } });
              const j = await r.json();
              setBusy(false);
              setMsg("Diag: " + JSON.stringify(j, null, 2));
            }} className="inline-flex items-center gap-1 rounded-md border border-white/15 bg-white/[0.04] hover:bg-white/[0.10] px-3 py-1.5 text-xs text-white/70">Diagnosztika</button>
          <p className="text-xs text-white/50">A beállítások automatikusan mentődnek.</p>
        </div>

        {msg && <div className="rounded-lg border border-emerald-400/40 bg-emerald-400/10 px-4 py-2.5 text-sm text-emerald-100 whitespace-pre-wrap font-mono break-all">{msg}</div>}
        {err && <div className="rounded-lg border border-red-400/40 bg-red-400/10 px-4 py-2.5 text-sm text-red-100">{err}</div>}

        <p className="text-xs text-white/40 text-center pt-4">Vitech Comp Kft. · HUNOR-COOP Zrt.</p>
      </div>
    </main>
  );
}
