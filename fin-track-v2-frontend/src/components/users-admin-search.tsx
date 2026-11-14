"use client";

import { SearchIcon } from "@/components/icons/search-icon";

export function UsersAdminSearch({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="relative">
      <SearchIcon />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Buscar por usuario o rol…"
        aria-label="Buscar usuarios"
        className="w-full rounded-lg border border-neutral-200 bg-neutral-50/70 py-2.5 pr-3 pl-9 text-sm text-neutral-900 placeholder:text-neutral-400 focus:ring-1 focus:ring-emerald-500 focus:outline-hidden dark:border-neutral-800 dark:bg-neutral-950 dark:text-white"
      />
    </div>
  );
}
