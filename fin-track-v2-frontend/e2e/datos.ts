export function categoriaUnica(prefijo: string) {
  return `E2E ${prefijo} ${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}
