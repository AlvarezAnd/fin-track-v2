import { Button } from "@/components/button";
import { CategoryIcon } from "@/components/category-icon";
import {
  CATEGORY_ICONS,
  CATEGORY_ICON_LABELS,
  type CategoryIconName,
} from "@/components/category-icon-data";

export function IconPicker({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (name: CategoryIconName) => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid grid-cols-6 gap-2" role="group" aria-label="Icono">
      {CATEGORY_ICONS.map((name) => (
        <Button
          key={name}
          size="icon"
          variant={value === name ? "primary" : "egreso"}
          aria-label={CATEGORY_ICON_LABELS[name]}
          aria-pressed={value === name}
          disabled={disabled}
          onClick={() => onChange(name)}
        >
          <CategoryIcon name={name} />
        </Button>
      ))}
    </div>
  );
}
