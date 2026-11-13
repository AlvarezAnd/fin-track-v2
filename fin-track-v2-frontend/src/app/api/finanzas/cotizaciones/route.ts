import { proxyApi } from "@/lib/api-proxy";

export async function GET() {
  return proxyApi("/cotizaciones");
}
