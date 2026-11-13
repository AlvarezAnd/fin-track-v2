import { LayersIcon } from "@/components/icons/layers-icon";
import { ArrowDownLeft } from "@/components/icons/arrow-down-left";
import { ArrowUpRight } from "@/components/icons/arrow-up-right";
import type { TipoMovimiento } from "@/lib/finance";

export type FiltroCategoria = "todo" | TipoMovimiento;

export function CategoryFiltroIcon({ id }: { id: FiltroCategoria }) {
  if (id === "egreso") {
    return <ArrowUpRight />;
  }

  if (id === "ingreso") {
    return <ArrowDownLeft />;
  }

  return <LayersIcon />;
}
