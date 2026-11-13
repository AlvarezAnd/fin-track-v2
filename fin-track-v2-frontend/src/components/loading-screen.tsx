import { Spinner } from "@/components/spinner";

export function LoadingScreen({
  label = "Cargando…",
  overlay = false,
  className = "",
}: {
  label?: string;
  overlay?: boolean;
  className?: string;
}) {
  const content = (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center gap-3 text-zinc-500 dark:text-zinc-400"
    >
      <Spinner />
      <span className="text-sm">{label}</span>
    </div>
  );

  if (overlay) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/85 backdrop-blur-[1px]">
        {content}
      </div>
    );
  }

  return (
    <div className={`flex flex-1 items-center justify-center py-16 ${className}`.trim()}>
      {content}
    </div>
  );
}
