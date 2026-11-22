import { proxyFile } from "@/lib/api-proxy";

type Params = { params: Promise<{ formato: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { formato } = await params;
  return proxyFile(`/transacciones/importar/plantilla/${encodeURIComponent(formato)}`);
}
