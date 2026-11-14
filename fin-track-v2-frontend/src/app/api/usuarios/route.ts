import { proxyApi } from "@/lib/api-proxy";

export async function GET() {
  return proxyApi("/usuarios");
}

export async function POST(request: Request) {
  return proxyApi("/usuarios", {
    method: "POST",
    body: await request.text(),
  });
}
