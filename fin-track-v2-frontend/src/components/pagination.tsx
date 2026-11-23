"use client";

export function Pagination({
  pagina,
  totalPaginas,
  onChange,
}: {
  pagina: number;
  totalPaginas: number;
  onChange: (pagina: number) => void;
}) {
  if (totalPaginas <= 1) {
    return null;
  }

  const buttonClassName =
    "cursor-pointer rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-800";

  return (
    <nav
      aria-label="Paginación"
      className="mt-4 flex items-center justify-between gap-3 border-t border-black/10 pt-4 dark:border-white/10"
    >
      <button
        type="button"
        className={buttonClassName}
        disabled={pagina <= 1}
        onClick={() => onChange(pagina - 1)}
      >
        Anterior
      </button>
      <span className="text-xs text-neutral-500 dark:text-neutral-400" aria-live="polite">
        Página {pagina} de {totalPaginas}
      </span>
      <button
        type="button"
        className={buttonClassName}
        disabled={pagina >= totalPaginas}
        onClick={() => onChange(pagina + 1)}
      >
        Siguiente
      </button>
    </nav>
  );
}
