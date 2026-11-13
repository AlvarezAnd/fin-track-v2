import {
  CATEGORY_ICONS,
  CATEGORY_ICON_PATHS,
  type CategoryIconName,
} from "@/components/category-icon-data";

export type { CategoryIconName } from "@/components/category-icon-data";
export {
  CATEGORY_ICONS,
  categoryIconLabel,
  suggestCategoryIcon,
} from "@/components/category-icon-data";

export function CategoryIcon({
  name,
  className = "size-5",
}: {
  name: string;
  className?: string;
}) {
  const icon = (CATEGORY_ICONS as readonly string[]).includes(name)
    ? (name as CategoryIconName)
    : "etiqueta";

  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {CATEGORY_ICON_PATHS[icon]}
    </svg>
  );
}
