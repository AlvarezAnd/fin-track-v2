"use client";

import { useEffect, useId, useRef, useState } from "react";
import { SETTINGS_INPUT_CLASS } from "@/components/settings-styles";
import { MONEDAS, type Moneda } from "@/lib/display";

export function MonedaSelect({
  value,
  labelledBy,
  onChange,
}: {
  value: Moneda;
  labelledBy: string;
  onChange: (moneda: Moneda) => void;
}) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [above, setAbove] = useState(false);
  const nombre = MONEDAS.find((item) => item.id === value)?.nombre ?? "Peso argentino";

  function toggle() {
    const rect = rootRef.current?.getBoundingClientRect();
    const spaceBelow = rect ? window.innerHeight - rect.bottom : 0;
    setAbove(spaceBelow < 280);
    setOpen((current) => !current);
  }

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
        className={`${SETTINGS_INPUT_CLASS} flex w-full items-center justify-between gap-3 text-left`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-labelledby={labelledBy}
        onClick={toggle}
      >
        <span className="truncate">{nombre}</span>
        <span aria-hidden="true" className="text-xs text-zinc-500">
          ▾
        </span>
      </button>
      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-labelledby={labelledBy}
          className={`absolute z-40 max-h-72 w-full overflow-y-auto rounded-xl border border-black/10 bg-background py-1 shadow-lg dark:border-white/15 ${above ? "bottom-full mb-2" : "top-full mt-2"}`}
        >
          {MONEDAS.map((item) => {
            const selected = item.id === value;

            return (
              <li key={item.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  className={`flex w-full px-3 py-2.5 text-left text-sm ${
                    selected
                      ? "bg-neutral-900 font-medium text-white dark:bg-neutral-800"
                      : "text-foreground hover:bg-black/[.04] dark:hover:bg-white/[.06]"
                  }`}
                  onClick={() => {
                    onChange(item.id);
                    setOpen(false);
                  }}
                >
                  {item.nombre}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
