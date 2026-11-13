import { proxyApi } from "@/lib/api-proxy";

export async function GET(request: Request) {
  const mes = new URL(request.url).searchParams.get("mes") ?? "";
  return proxyApi(`/transacciones?mes=${encodeURIComponent(mes)}`);
}

export async function POST(request: Request) {
  return proxyApi("/transacciones", {
    method: "POST",
    body: await request.text(),
  });
}
