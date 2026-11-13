import { proxyApi } from "@/lib/api-proxy";

const TIPO = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export async function POST(request: Request) {
  return proxyApi("/transacciones/importar", {
    method: "POST",
    headers: { "content-type": TIPO },
    body: await request.arrayBuffer(),
  });
}
