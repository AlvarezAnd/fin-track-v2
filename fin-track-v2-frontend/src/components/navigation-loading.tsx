"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { LoadingScreen } from "@/components/loading-screen";

let pending = false;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) {
    listener();
  }
}

export function beginRouteLoading() {
  if (pending) {
    return;
  }

  pending = true;
  emit();
}

export function endRouteLoading() {
  if (!pending) {
    return;
  }

  pending = false;
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return pending;
}

function getServerSnapshot() {
  return false;
}

function isInternalHref(href: string) {
  return href.startsWith("/") && !href.startsWith("//");
}

function sameDestination(href: string) {
  const next = new URL(href, window.location.origin);
  return (
    next.pathname === window.location.pathname &&
    next.search === window.location.search
  );
}

export function NavigationLoading() {
  const pathname = usePathname();
  const storePending = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [pathPending, setPathPending] = useState(false);

  useEffect(() => {
    endRouteLoading();
    setPathPending(false);
  }, [pathname]);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0) {
        return;
      }

      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      const anchor = (event.target as Element | null)?.closest("a");

      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) {
        return;
      }

      const href = anchor.getAttribute("href");

      if (!href || !isInternalHref(href) || sameDestination(href)) {
        return;
      }

      beginRouteLoading();
      setPathPending(true);
    }

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  if (!storePending && !pathPending) {
    return null;
  }

  return <LoadingScreen overlay label="Cargando…" />;
}
