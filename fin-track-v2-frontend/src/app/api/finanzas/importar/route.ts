import { proxyApi } from "@/lib/api-proxy";

const EXCEL = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const CSV = "text/csv";

export async function POST(request: Request) {
  const incoming = request.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase();
  const contentType = incoming === CSV || incoming === "application/csv" ? CSV : EXCEL;

  return proxyApi("/transacciones/importar", {
    method: "POST",
    headers: { "content-type": contentType },
    body: await request.arrayBuffer(),
  });
}
