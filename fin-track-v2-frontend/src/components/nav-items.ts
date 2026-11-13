export const NAV_ITEMS = [
  { href: "/dashboard", label: "Resumen", exact: true, icon: "resumen" },
  { href: "/dashboard/movimientos", label: "Movimientos", exact: false, icon: "movimientos" },
  { href: "/dashboard/categorias", label: "Categorías", exact: false, icon: "categorias" },
  { href: "/dashboard/estadisticas", label: "Estadísticas", exact: false, icon: "estadisticas" },
  { href: "/dashboard/configuracion", label: "Configuración", exact: false, icon: "configuracion" },
] as const;

export type NavIconName = (typeof NAV_ITEMS)[number]["icon"];
