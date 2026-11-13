import type { ReactNode } from "react";

export const CATEGORY_ICONS = [
  "etiqueta",
  "dinero",
  "comida",
  "casa",
  "transporte",
  "salud",
  "compras",
  "trabajo",
  "ocio",
  "educacion",
  "servicios",
  "regalo",
] as const;

export type CategoryIconName = (typeof CATEGORY_ICONS)[number];

export const CATEGORY_ICON_LABELS: Record<CategoryIconName, string> = {
  etiqueta: "Etiqueta",
  dinero: "Dinero",
  comida: "Comida",
  casa: "Casa",
  transporte: "Transporte",
  salud: "Salud",
  compras: "Compras",
  trabajo: "Trabajo",
  ocio: "Ocio",
  educacion: "Educación",
  servicios: "Servicios",
  regalo: "Regalo",
};

export function categoryIconLabel(name: string) {
  return CATEGORY_ICON_LABELS[name as CategoryIconName] ?? CATEGORY_ICON_LABELS.etiqueta;
}

export function suggestCategoryIcon(nombre: string): CategoryIconName {
  const text = nombre.toLocaleLowerCase("es-AR");

  if (/sueldo|salario|freelance|trabajo|honorario/.test(text)) return "trabajo";
  if (/comida|super|resto|almuerzo|cena|cafe|café/.test(text)) return "comida";
  if (/alquiler|casa|hogar|expensa/.test(text)) return "casa";
  if (/uber|taxi|nafta|transporte|colectivo|subte/.test(text)) return "transporte";
  if (/farmacia|salud|médico|medico|obra social/.test(text)) return "salud";
  if (/ropa|compra|shopping/.test(text)) return "compras";
  if (/netflix|cine|ocio|juego/.test(text)) return "ocio";
  if (/curso|facultad|educaci[oó]n|colegio/.test(text)) return "educacion";
  if (/luz|gas|internet|servicio|tel[eé]fono/.test(text)) return "servicios";
  if (/regalo/.test(text)) return "regalo";
  if (/banco|inversi[oó]n|ahorro|dinero/.test(text)) return "dinero";

  return "etiqueta";
}

export const CATEGORY_ICON_PATHS: Record<CategoryIconName, ReactNode> = {
  etiqueta: <path d="M20 13.5 12.5 21a2 2 0 0 1-2.8 0L3 14.3V4h10.3Z" />,
  dinero: (
    <>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.5" />
    </>
  ),
  comida: (
    <>
      <path d="M6 3v8" />
      <path d="M10 3v8" />
      <path d="M6 7h4" />
      <path d="M8 11v10" />
      <path d="M16 3c-2 3-2 6 0 8v10" />
    </>
  ),
  casa: <path d="M4 11.5 12 4l8 7.5V20H4Z" />,
  transporte: (
    <>
      <path d="M4 15h16" />
      <path d="M6 15 8 8h8l2 7" />
      <circle cx="7.5" cy="17.5" r="1.5" />
      <circle cx="16.5" cy="17.5" r="1.5" />
    </>
  ),
  salud: <path d="M12 20s-7-4.4-7-9a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 4.6-7 9-7 9Z" />,
  compras: (
    <>
      <path d="M6 8h12l-1 12H7Z" />
      <path d="M9 8V7a3 3 0 0 1 6 0v1" />
    </>
  ),
  trabajo: (
    <>
      <rect x="3" y="7" width="18" height="12" rx="2" />
      <path d="M9 7V5h6v2" />
    </>
  ),
  ocio: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M8 5v14M16 5v14M3 12h18" />
    </>
  ),
  educacion: <path d="M3 8.5 12 4l9 4.5L12 13Z M7 11.2V16c1.6 1.3 3.2 2 5 2s3.4-.7 5-2v-4.8" />,
  servicios: <path d="M13 3 6 13h6l-1 8 7-10h-6Z" />,
  regalo: (
    <>
      <rect x="4" y="10" width="16" height="10" rx="1" />
      <path d="M4 14h16M12 10v10" />
      <path d="M12 10c-2-4-6-3-5 0 2 0 5 0 5 0Zm0 0c2-4 6-3 5 0-2 0-5 0-5 0Z" />
    </>
  ),
};
