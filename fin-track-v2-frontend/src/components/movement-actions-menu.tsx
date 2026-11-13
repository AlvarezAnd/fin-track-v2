"use client";

import { useEffect, useId, useRef, useState } from "react";
import { MoreIcon } from "@/components/icons/more-icon";

export function MovementActionsMenu({
  onView,
  onEdit,
  onDelete,
}: {
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
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
        aria-label="Acciones del movimiento"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((current) => !current)}
        className="cursor-pointer rounded-md p-1.5 text-neutral-400 transition-colors hover:bg-neutral-200/60 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-white"
      >
        <MoreIcon />
      </button>
      {open ? (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 z-40 mt-1 w-40 overflow-hidden rounded-xl border border-black/10 bg-background py-1 shadow-lg dark:border-white/15"
        >
          <button
            type="button"
            role="menuitem"
            className="flex w-full cursor-pointer px-3 py-2.5 text-left text-sm hover:bg-black/[.04] dark:hover:bg-white/[.06]"
            onClick={() => {
              setOpen(false);
              onView();
            }}
          >
            Ver
          </button>
          <button
            type="button"
            role="menuitem"
            className="flex w-full cursor-pointer px-3 py-2.5 text-left text-sm hover:bg-black/[.04] dark:hover:bg-white/[.06]"
            onClick={() => {
              setOpen(false);
              onEdit();
            }}
          >
            Editar
          </button>
          <button
            type="button"
            role="menuitem"
            className="flex w-full cursor-pointer px-3 py-2.5 text-left text-sm text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
          >
            Eliminar
          </button>
        </div>
      ) : null}
    </div>
  );
}
