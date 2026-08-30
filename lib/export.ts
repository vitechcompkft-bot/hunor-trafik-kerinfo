"use client";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toPng } from "html-to-image";

export type ExportColumn = { header: string; key: string; format?: "ft" | "num" | "pct" | "text" };

function fmt(v: unknown, f?: ExportColumn["format"]): string {
  if (v == null || v === "") return "";
  if (f === "ft") return typeof v === "number" ? Math.round(v).toLocaleString("hu-HU") + " Ft" : String(v);
  if (f === "num") return typeof v === "number" ? v.toLocaleString("hu-HU") : String(v);
  if (f === "pct") return typeof v === "number" ? v.toFixed(2) + "%" : String(v);
  return String(v);
}

export function exportTableToXlsx<T extends Record<string, unknown>>(
  rows: T[], columns: ExportColumn[], filename: string, sheetName = "Adatok"
) {
  // Fejléc + adatsorok (nyers számokat írunk, format csak látvány)
  const aoa: (string | number)[][] = [columns.map(c => c.header)];
  for (const r of rows) {
    aoa.push(columns.map(c => {
      const v = r[c.key];
      if (v == null) return "";
      if (typeof v === "number") return v;
      return String(v);
    }));
  }
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  // Számformátumok az oszlopokra
  const range = XLSX.utils.decode_range(ws["!ref"]!);
  for (let c = 0; c <= range.e.c; c++) {
    const col = columns[c];
    if (!col) continue;
    for (let r = 1; r <= range.e.r; r++) {
      const cell = ws[XLSX.utils.encode_cell({ r, c })];
      if (!cell || typeof cell.v !== "number") continue;
      if (col.format === "ft") cell.z = "#,##0 \"Ft\"";
      else if (col.format === "num") cell.z = "#,##0";
      else if (col.format === "pct") cell.z = "0.00\"%\"";
    }
  }
  ws["!cols"] = columns.map(c => ({ wch: Math.max(c.header.length + 2, c.format === "ft" ? 15 : 10) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filename);
}

export function exportTableToPdf<T extends Record<string, unknown>>(
  rows: T[], columns: ExportColumn[], filename: string, title: string
) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  doc.setFontSize(14);
  doc.text(title, 14, 15);
  autoTable(doc, {
    startY: 20,
    head: [columns.map(c => c.header)],
    body: rows.map(r => columns.map(c => fmt(r[c.key], c.format))),
    styles: { fontSize: 8, cellPadding: 1.5 },
    headStyles: { fillColor: [26, 115, 232], textColor: 255 },
    alternateRowStyles: { fillColor: [240, 245, 251] },
    columnStyles: columns.reduce((acc, c, i) => {
      if (c.format && c.format !== "text") acc[i] = { halign: "right" };
      return acc;
    }, {} as Record<number, { halign: "right" }>),
  });
  doc.save(filename);
}

// Diagram-export: az egész kártyát képként rögzíti (SVG + HTML legend + title együtt),
// az .export-hide (export-gombok) elemek elrejtve a képfelvétel idejére.
async function captureChart(container: HTMLElement, scale = 2): Promise<string> {
  const hidden = Array.from(container.querySelectorAll<HTMLElement>(".export-hide"));
  const prev = hidden.map(el => el.style.visibility);
  hidden.forEach(el => { el.style.visibility = "hidden"; });
  try {
    return await toPng(container, {
      pixelRatio: scale,
      backgroundColor: "#0D2540",
      cacheBust: true,
      // recharts a defs-be kerülő SVG-elemekhez kap style-t ami CORS-mentes, tehát nincs foreignObject
    });
  } finally {
    hidden.forEach((el, i) => { el.style.visibility = prev[i]; });
  }
}

export async function exportChartToPng(container: HTMLElement, filename: string) {
  try {
    const dataUrl = await captureChart(container, 2);
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = filename;
    a.click();
  } catch (e) {
    console.error("PNG-export hiba:", e);
    alert("Nem sikerült exportálni PNG-be: " + (e as Error).message);
  }
}

export async function exportChartToPdf(container: HTMLElement, filename: string, title: string) {
  try {
    const dataUrl = await captureChart(container, 2);
    // Kép-méretek megállapítása a betöltött képből
    const img = new Image();
    await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = () => rej(new Error("PDF-kép betöltés hiba")); img.src = dataUrl; });
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    doc.setFontSize(14);
    doc.text(title, 14, 15);
    const maxW = 270, maxH = 170;
    const ratio = img.width / img.height;
    let w = maxW, h = maxW / ratio;
    if (h > maxH) { h = maxH; w = maxH * ratio; }
    doc.addImage(dataUrl, "PNG", (297 - w) / 2, 25, w, h);
    doc.save(filename);
  } catch (e) {
    console.error("PDF-export hiba:", e);
    alert("Nem sikerült exportálni PDF-be: " + (e as Error).message);
  }
}
