"use client";
import { Download } from "lucide-react";

type Props =
  | { kind: "table"; onXlsx: () => void; onPdf: () => void }
  | { kind: "chart"; onPng: () => void; onPdf: () => void };

export function ExportGombok(props: Props) {
  return (
    <div className="inline-flex items-center gap-1 shrink-0">
      {props.kind === "table" ? (
        <>
          <button onClick={props.onXlsx} title="Letöltés Excel-fájlba (XLSX)"
            className="inline-flex items-center gap-1 rounded-md border border-white/15 bg-white/[0.04] hover:bg-white/[0.10] px-2 py-1 text-xs text-white/85">
            <Download className="h-3.5 w-3.5" />XLSX
          </button>
          <button onClick={props.onPdf} title="Letöltés PDF-be"
            className="inline-flex items-center gap-1 rounded-md border border-white/15 bg-white/[0.04] hover:bg-white/[0.10] px-2 py-1 text-xs text-white/85">
            <Download className="h-3.5 w-3.5" />PDF
          </button>
        </>
      ) : (
        <>
          <button onClick={props.onPng} title="Letöltés PNG-képként"
            className="inline-flex items-center gap-1 rounded-md border border-white/15 bg-white/[0.04] hover:bg-white/[0.10] px-2 py-1 text-xs text-white/85">
            <Download className="h-3.5 w-3.5" />PNG
          </button>
          <button onClick={props.onPdf} title="Letöltés PDF-be"
            className="inline-flex items-center gap-1 rounded-md border border-white/15 bg-white/[0.04] hover:bg-white/[0.10] px-2 py-1 text-xs text-white/85">
            <Download className="h-3.5 w-3.5" />PDF
          </button>
        </>
      )}
    </div>
  );
}
