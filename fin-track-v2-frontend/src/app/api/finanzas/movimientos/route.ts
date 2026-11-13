import { proxyApi } from "@/lib/api-proxy";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const desde = url.searchParams.get("desde") ?? "";
  const hasta = url.searchParams.get("hasta") ?? "";

  return proxyApi(
    `/transacciones?desde=${encodeURIComponent(desde)}&hasta=${encodeURIComponent(hasta)}`,
  );
}
