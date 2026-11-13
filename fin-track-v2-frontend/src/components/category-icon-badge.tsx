import { CategoryIcon } from "@/components/category-icon";

export function CategoryIconBadge({
  name,
  ingreso,
  label,
}: {
  name: string;
  ingreso: boolean;
  label?: string;
}) {
  return (
    <span
      className={`flex size-9 shrink-0 items-center justify-center rounded-lg border ${
        ingreso
          ? "border-emerald-600 text-emerald-700 dark:border-emerald-500 dark:text-emerald-400"
          : "border-black/10 dark:border-white/15"
      }`}
      aria-label={label}
    >
      <CategoryIcon name={name} />
    </span>
  );
}
