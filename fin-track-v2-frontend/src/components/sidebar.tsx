"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavIcon } from "@/components/nav-icon";
import { NAV_ITEMS } from "@/components/nav-items";

function isCurrent(pathname: string, href: string, exact: boolean) {
  return exact ? pathname === href : pathname.startsWith(href);
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-dvh w-56 shrink-0 flex-col border-r border-black/10 bg-background xl:flex dark:border-white/10">
      <div className="flex min-h-16 items-center px-5">
        <p className="text-base font-semibold tracking-tight">Fin Track</p>
      </div>
      <nav aria-label="Secciones" className="flex flex-1 flex-col gap-1 px-3 pb-4">
        {NAV_ITEMS.map((item) => {
          const current = isCurrent(pathname, item.href, item.exact);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={current ? "page" : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm ${
                current
                  ? "bg-black/[.06] font-medium dark:bg-white/[.08]"
                  : "text-zinc-600 hover:bg-black/[.04] dark:text-zinc-300 dark:hover:bg-white/[.06]"
              }`}
            >
              <NavIcon name={item.icon} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
