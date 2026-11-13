import { proxyApi } from "@/lib/api-proxy";

export async function PATCH(request: Request) {
  return proxyApi("/auth/contrasena", {
    method: "PATCH",
    body: await request.text(),
  });
}
