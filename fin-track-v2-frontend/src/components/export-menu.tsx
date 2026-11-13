"use client";

import { useEffect, useId, useRef, useState } from "react";
import { DownloadIcon } from "@/components/icons/download-icon";

export type FormatoExportacion = "csv" | "excel" | "pdf";

const FORMATOS: { id: FormatoExportacion; label: string }[] = [
  { id: "csv", label: "CSV" },
  { id: "excel", label: "Excel" },
  { id: "pdf", label: "PDF" },
];

export function ExportMenu({
  disabled,
  onExport,
}: {
  disabled: boolean;
  onExport: (formato: FormatoExportacion) => void;
}) {
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-100 disabled:cursor-default disabled:opacity-60 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-900"
      >
        <DownloadIcon />
        <span>Exportar</span>
        <span aria-hidden="true" className="text-[10px] text-neutral-500">
          ▾
        </span>
      </button>
      {open ? (
        <div
          id={menuId}
          role="menu"
          className="absolute left-0 z-30 mt-2 w-36 overflow-hidden rounded-xl border border-black/10 bg-background py-1 shadow-lg sm:right-0 sm:left-auto dark:border-white/15"
        >
          {FORMATOS.map((formato) => (
            <button
              key={formato.id}
              type="button"
              role="menuitem"
              className="flex w-full cursor-pointer px-3 py-2.5 text-left text-sm text-foreground hover:bg-black/[.04] dark:hover:bg-white/[.06]"
              onClick={() => {
                setOpen(false);
                onExport(formato.id);
              }}
            >
              {formato.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
