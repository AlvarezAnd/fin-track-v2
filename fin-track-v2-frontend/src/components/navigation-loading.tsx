"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { LoadingScreen } from "@/components/loading-screen";
import { beginRouteLoading, endRouteLoading, useRouteLoading } from "@/components/use-route-loading";

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

/**
 * Tracks internal link clicks for the whole app. Inside the dashboard the layout
 * (header, navigation, assistant) must stay usable, so there `ContentLoading`
 * covers only the content area; the full-screen overlay is for entering it.
 */
export function NavigationLoading() {
  const pathname = usePathname();
  const pending = useRouteLoading();

  useEffect(() => {
    endRouteLoading();
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
    }

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  if (!pending || pathname.startsWith("/dashboard")) {
    return null;
  }

  return <LoadingScreen overlay label="Cargando…" />;
}
