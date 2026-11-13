import type { ReactNode } from "react";

export function Tabs<T extends string>({
  value,
  onChange,
  options,
  label,
  disabled = false,
}: {
  value: T;
  onChange: (value: T) => void;
  options: {
    id: T;
    label: string;
    icon?: ReactNode;
    className?: string;
    selectedClassName?: string;
  }[];
  label: string;
  disabled?: boolean;
}) {
  return (
    <div
      className="inline-flex w-max max-w-full flex-wrap items-center rounded-lg border border-neutral-200 bg-neutral-200/60 p-1 dark:border-neutral-800 dark:bg-neutral-900"
      role="group"
      aria-label={label}
    >
      {options.map((item) => {
        const selected = value === item.id;

        return (
          <button
            key={item.id}
            type="button"
            aria-pressed={selected}
            disabled={disabled}
            onClick={() => onChange(item.id)}
            className={`flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all disabled:cursor-default disabled:opacity-60 ${
              selected
                ? (item.selectedClassName ??
                  "bg-neutral-900 text-white shadow-xs dark:bg-neutral-800 dark:text-white")
                : (item.className ??
                  "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white")
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
