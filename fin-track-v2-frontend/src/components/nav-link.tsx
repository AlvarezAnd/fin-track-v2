import Link from "next/link";
import { NavIcon } from "@/components/nav-icon";
import type { NavIconName } from "@/components/nav-items";

export function NavLink({
  href,
  label,
  icon,
  current,
}: {
  href: string;
  label: string;
  icon: NavIconName;
  current: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={current ? "page" : undefined}
      className={`flex min-h-16 flex-col items-center justify-center gap-1 px-1 py-2 text-center text-[11px] leading-tight ${current ? "font-semibold" : "text-zinc-500 dark:text-zinc-400"}`}
    >
      <NavIcon name={icon} />
      {label}
    </Link>
  );
}
