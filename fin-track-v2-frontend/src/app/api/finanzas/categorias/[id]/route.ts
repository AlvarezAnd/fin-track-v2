import { proxyApi } from "@/lib/api-proxy";

type Context = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: Context) {
  const { id } = await context.params;
  return proxyApi(`/categorias/${id}`, {
    method: "PATCH",
    body: await request.text(),
  });
}

export async function DELETE(_request: Request, context: Context) {
  const { id } = await context.params;
  return proxyApi(`/categorias/${id}`, { method: "DELETE" });
}
