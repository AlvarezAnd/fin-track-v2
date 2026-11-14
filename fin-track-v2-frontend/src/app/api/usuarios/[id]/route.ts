import { proxyApi } from "@/lib/api-proxy";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  return proxyApi(`/usuarios/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: await request.text(),
  });
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  return proxyApi(`/usuarios/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
