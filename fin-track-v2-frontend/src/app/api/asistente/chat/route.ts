import { proxyApi } from "@/lib/api-proxy";

export async function POST(request: Request) {
  return proxyApi("/asistente/chat", {
    method: "POST",
    body: await request.text(),
  });
}
