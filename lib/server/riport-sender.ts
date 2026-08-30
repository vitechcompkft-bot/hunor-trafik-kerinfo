// Email-küldés (Gmail SMTP) + XLSX-melléklet az előző napi trafik-adatokból.
import nodemailer from "nodemailer";
import * as XLSX from "xlsx";
import type { TrafikData, NapiSor } from "@/lib/types";

const SITE_URL = "https://trafik.hunorcoop.hu";

export async function generateXlsxAttachment(data: TrafikData, datum: string): Promise<Buffer> {
  const sorok: NapiSor[] = data.napi[datum] || [];
  const aoa: (string | number)[][] = [
    ["Trafik", "ÁrbevBr (Ft)", "ÁrRésNe (Ft)", "ÁrRés %", "BlokkDb", "ZáróBr (Ft)", "Leértössz (Ft)", "LeírásBr (Ft)", "EmozgBr (Ft)", "ÁrrésVeszteség %"],
    ...sorok.map(r => [
      r.nev, Math.round(r.forgalom), Math.round(r.arres_ne || 0), Number((r.arres_sz || 0).toFixed(2)),
      r.vevoszam, Math.round(r.keszlet_br || 0),
      Math.round(r.leertekeles || 0), Math.round(r.leiras_br || 0), Math.round(r.emozg_br || 0),
      Number((r.arres_veszteseg || 0).toFixed(2)),
    ]),
    // Összesen sor
    (() => {
      const sForg = sorok.reduce((s, r) => s + r.forgalom, 0);
      const sVev = sorok.reduce((s, r) => s + r.vevoszam, 0);
      const sArr = sorok.reduce((s, r) => s + (r.arres_ne || 0), 0);
      const sKesz = sorok.reduce((s, r) => s + (r.keszlet_br || 0), 0);
      const sLe = sorok.reduce((s, r) => s + (r.leertekeles || 0), 0);
      const sEm = sorok.reduce((s, r) => s + (r.emozg_br || 0), 0);
      return ["Összesen", Math.round(sForg), Math.round(sArr), 0, sVev, Math.round(sKesz), Math.round(sLe), 0, Math.round(sEm), 0];
    })(),
  ];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  // Számformátumok
  const range = XLSX.utils.decode_range(ws["!ref"]!);
  for (let r = 1; r <= range.e.r; r++) {
    for (let c = 1; c <= range.e.c; c++) {
      const cell = ws[XLSX.utils.encode_cell({ r, c })];
      if (!cell || typeof cell.v !== "number") continue;
      if (c === 3 || c === 9) cell.z = "0.00\"%\"";
      else if (c === 4) cell.z = "#,##0";
      else cell.z = "#,##0 \"Ft\"";
    }
  }
  ws["!cols"] = [{ wch: 40 }, { wch: 15 }, { wch: 14 }, { wch: 10 }, { wch: 10 }, { wch: 15 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, `Napi ${datum}`);
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
}

function fmtDatum(d: string) {
  const [y, m, day] = d.split("-");
  return `${y}. ${m}. ${day}.`;
}

function buildHtml(data: TrafikData, datum: string) {
  const sorok = data.napi[datum] || [];
  const nyitva = sorok.filter(r => r.forgalom > 0).length;
  const ossz = sorok.length;
  const sForg = sorok.reduce((s, r) => s + r.forgalom, 0);
  const sVev = sorok.reduce((s, r) => s + r.vevoszam, 0);
  const ft = (n: number) => Math.round(n).toLocaleString("hu-HU") + " Ft";
  const num = (n: number) => n.toLocaleString("hu-HU");
  const top3 = [...sorok].sort((a, b) => b.forgalom - a.forgalom).slice(0, 3);

  return `<!doctype html><html lang="hu"><body style="margin:0;padding:0;background:#f4f6fb;font-family:'Segoe UI',Arial,sans-serif;color:#0D2540;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fb;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(13,37,64,0.08);">
        <tr><td style="background:linear-gradient(180deg,#1E88F5,#14345f);padding:24px 28px;color:#ffffff;">
          <div style="font-size:12px;letter-spacing:2px;opacity:0.85;text-transform:uppercase;">HUNOR-COOP · Trafik-kimutatás</div>
          <div style="font-size:22px;font-weight:700;margin-top:4px;">Napi forgalom · ${fmtDatum(datum)}</div>
        </td></tr>
        <tr><td style="padding:24px 28px;">
          <p style="margin:0 0 16px 0;font-size:14px;line-height:1.6;color:#0D2540;">Tisztelt Címzett!</p>
          <p style="margin:0 0 20px 0;font-size:14px;line-height:1.6;color:#0D2540;">Mellékelve küldjük a <b>${fmtDatum(datum)}</b> napi trafik-forgalmi adatait Excel-fájlban.</p>

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;border-spacing:0 8px;margin:8px 0 20px 0;">
            <tr><td style="background:#f4f6fb;padding:14px 16px;border-radius:8px;">
              <div style="font-size:12px;color:#5c6b80;text-transform:uppercase;letter-spacing:1px;">Össz-forgalom</div>
              <div style="font-size:22px;font-weight:700;color:#1A73E8;margin-top:2px;">${ft(sForg)}</div>
            </td></tr>
            <tr><td style="background:#f4f6fb;padding:14px 16px;border-radius:8px;">
              <div style="font-size:12px;color:#5c6b80;text-transform:uppercase;letter-spacing:1px;">Vevőszám</div>
              <div style="font-size:22px;font-weight:700;color:#0D2540;margin-top:2px;">${num(sVev)}</div>
            </td></tr>
            <tr><td style="background:#f4f6fb;padding:14px 16px;border-radius:8px;">
              <div style="font-size:12px;color:#5c6b80;text-transform:uppercase;letter-spacing:1px;">Nyitva volt</div>
              <div style="font-size:22px;font-weight:700;color:#0D2540;margin-top:2px;">${nyitva} / ${ossz} trafik</div>
            </td></tr>
          </table>

          <div style="font-size:12px;color:#5c6b80;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Top 3 trafik</div>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:13px;">
            ${top3.map(r => `<tr><td style="padding:6px 8px;border-bottom:1px solid #eef1f6;">${r.nev}</td><td style="padding:6px 8px;border-bottom:1px solid #eef1f6;text-align:right;font-weight:600;color:#0D2540;white-space:nowrap;">${ft(r.forgalom)}</td></tr>`).join("")}
          </table>

          <div style="margin-top:24px;text-align:center;">
            <a href="${SITE_URL}" style="display:inline-block;background:#1A73E8;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 24px;border-radius:8px;">Teljes dashboard megnyitása →</a>
          </div>

          <p style="margin:24px 0 0 0;font-size:12px;line-height:1.5;color:#8592a6;text-align:center;">
            Ez egy automatikus üzenet, kérjük ne válaszoljon rá.<br>
            <a href="${SITE_URL}" style="color:#1A73E8;text-decoration:none;">${SITE_URL}</a>
          </p>
        </td></tr>
        <tr><td style="padding:16px 28px;background:#f4f6fb;text-align:center;font-size:11px;color:#8592a6;">
          Vitech Comp Kft. · HUNOR-COOP Zrt. trafik-kerinfo dashboard
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export async function sendRiport(data: TrafikData, datum: string, emails: string[]): Promise<{ ok: boolean; message: string }> {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) return { ok: false, message: "GMAIL_USER / GMAIL_APP_PASSWORD nincs beállítva a Vercel env-ben" };
  if (!emails.length) return { ok: false, message: "Nincsenek beállított email-címek" };

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com", port: 465, secure: true,
    auth: { user, pass: pass.replace(/\s+/g, "") },
  });
  const xlsx = await generateXlsxAttachment(data, datum);
  const html = buildHtml(data, datum);

  const info = await transporter.sendMail({
    from: `"HUNOR-COOP trafik-riport" <${user}>`,
    to: emails.join(", "),
    subject: `Trafik-forgalom · ${fmtDatum(datum)}`,
    html,
    attachments: [{ filename: `trafik-napi-${datum}.xlsx`, content: xlsx }],
  });
  return { ok: true, message: `Kiküldve ${emails.length} címre (messageId: ${info.messageId})` };
}
