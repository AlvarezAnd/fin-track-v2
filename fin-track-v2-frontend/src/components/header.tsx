"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { logout } from "@/app/dashboard/actions";
import { Button } from "@/components/button";
import { beginRouteLoading } from "@/components/use-route-loading";
import { applyTheme, subscribeTheme, type Theme } from "@/lib/theme";

const APP_NAME = "Fin Track";

const menuItemClassName =
  "flex w-full cursor-pointer px-3 py-2.5 text-left text-sm text-foreground hover:bg-black/[.04] dark:hover:bg-white/[.06]";

export function Header({ username }: { username: string }) {
  const router = useRouter();
  const menuId = useId();
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>("light");

  useLayoutEffect(() => {
    const sync = () => {
      setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
    };

    sync();
    return subscribeTheme(sync);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    function onPointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
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

  function toggleTheme() {
    const next: Theme = document.documentElement.classList.contains("dark") ? "light" : "dark";
    applyTheme(next);
    setTheme(next);
  }

  const themeLabel =
    theme === "dark" ? "Cambiar a tema claro" : "Cambiar a tema oscuro";

  return (
    <header className="border-b border-black/10 pt-[env(safe-area-inset-top)] dark:border-white/10">
      <div className="mx-auto flex min-h-14 w-full max-w-5xl items-center justify-between gap-3 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] sm:min-h-16 sm:px-6 xl:ml-0 xl:max-w-none xl:justify-end">
        <p className="text-base font-semibold tracking-tight xl:hidden">
          {APP_NAME}
        </p>
        <div className="relative" ref={menuRef}>
          <Button
            variant="egreso"
            className="max-w-[12rem] !border-transparent sm:max-w-none xl:!border-black/10 dark:!border-transparent dark:xl:!border-white/15"
            aria-haspopup="menu"
            aria-expanded={open}
            aria-controls={menuId}
            aria-label="Menú de sesión"
            onClick={() => setOpen((current) => !current)}
          >
            <span className="max-w-40 truncate">{username}</span>
            <span aria-hidden="true" className="text-xs text-zinc-500">
              ▾
            </span>
          </Button>
          {open ? (
            <div
              id={menuId}
              role="menu"
              className="absolute right-0 z-30 mt-2 w-[min(16rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-black/10 bg-background py-1 shadow-lg dark:border-white/15"
            >
              <button
                type="button"
                role="menuitem"
                className={menuItemClassName}
                onClick={() => {
                  setOpen(false);
                  beginRouteLoading();
                  router.push("/dashboard/configuracion");
                }}
              >
                Configuración
              </button>
              <form action={logout}>
                <button type="submit" role="menuitem" className={menuItemClassName}>
                  Cerrar sesión
                </button>
              </form>
              <button type="button" role="menuitem" className={menuItemClassName} onClick={toggleTheme}>
                {themeLabel}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
