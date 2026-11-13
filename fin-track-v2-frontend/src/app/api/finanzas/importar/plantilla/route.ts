import { proxyFile } from "@/lib/api-proxy";

export async function GET() {
  return proxyFile("/transacciones/importar/plantilla");
}
