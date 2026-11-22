"use client";

import { LoadingScreen } from "@/components/loading-screen";
import { useRouteLoading } from "@/components/use-route-loading";

/**
 * Spinner for a page change inside the dashboard. It covers only the content
 * area of the layout, below the header and under the bottom bar and the assistant.
 */
export function ContentLoading() {
  const pending = useRouteLoading();

  if (!pending) {
    return null;
  }

  return (
    <div className="absolute inset-0 z-20 bg-background/85 backdrop-blur-[1px]">
      <div className="sticky top-0 flex h-[calc(100dvh-8rem)]">
        <LoadingScreen label="Cargando…" />
      </div>
    </div>
  );
}
