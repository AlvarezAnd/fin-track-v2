import type { TipoMovimiento } from "@/lib/finance";

export type CategoriaItem = {
  id: string;
  nombre: string;
  tipo: TipoMovimiento;
  icono: string;
};

export const CATEGORY_INPUT_CLASS =
  "h-12 rounded-lg border border-black/10 bg-transparent px-3 text-base font-normal outline-none focus:border-foreground sm:h-11 dark:border-white/15";
