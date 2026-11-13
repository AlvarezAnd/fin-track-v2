"use client";

import { usePathname } from "next/navigation";
import { Button } from "@/components/button";
import { NAV_ITEMS } from "@/components/nav-items";
import { NavLink } from "@/components/nav-link";

function isCurrent(pathname: string, href: string, exact: boolean) {
  return exact ? pathname === href : pathname.startsWith(href);
}

export function BottomNav({ onCreate }: { onCreate: () => void }) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((item) => item.icon !== "configuracion");

  return (
    <nav
      aria-label="Secciones"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-black/10 bg-background pb-[env(safe-area-inset-bottom)] xl:hidden dark:border-white/10"
    >
      <div className="grid grid-cols-5 items-end">
        {items.slice(0, 2).map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            current={isCurrent(pathname, item.href, item.exact)}
          />
        ))}
        <div className="flex justify-center">
          <Button
            size="fab"
            variant="primary"
            aria-label="Registrar movimiento"
            onClick={onCreate}
          >
            +
          </Button>
        </div>
        {items.slice(2).map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            current={isCurrent(pathname, item.href, item.exact)}
          />
        ))}
      </div>
    </nav>
  );
}
