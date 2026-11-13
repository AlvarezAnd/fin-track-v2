import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "ingreso" | "egreso" | "primary";
type ButtonSize = "md" | "icon" | "fab";

const variants: Record<ButtonVariant, string> = {
  ingreso:
    "border border-emerald-600 bg-emerald-800 text-white hover:bg-emerald-900 dark:border-emerald-500 dark:bg-emerald-900 dark:hover:bg-emerald-950",
  egreso:
    "border border-black/10 bg-transparent text-foreground hover:bg-black/[.04] dark:border-white/15 dark:hover:bg-white/[.06]",
  primary:
    "border border-transparent bg-foreground text-background hover:opacity-90",
};

const sizes: Record<ButtonSize, string> = {
  md: "h-12 rounded-lg px-5 sm:h-11",
  icon: "size-11 rounded-lg p-0 sm:size-10",
  fab: "relative -top-4 size-14 rounded-full p-0 text-3xl leading-none shadow-lg",
};

export function Button({
  variant = "egreso",
  size = "md",
  align = "center",
  className = "",
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  align?: "center" | "start";
}) {
  const alignment = align === "start" ? "justify-start" : "justify-center";

  return (
    <button
      type={type}
      className={`inline-flex shrink-0 items-center ${alignment} gap-2 text-sm font-medium disabled:opacity-60 ${sizes[size]} ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
