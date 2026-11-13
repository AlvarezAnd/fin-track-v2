import { proxyApi } from "@/lib/api-proxy";

type Context = {
  params: Promise<{ moneda: string }>;
};

export async function PUT(request: Request, context: Context) {
  const { moneda } = await context.params;
  return proxyApi(`/cotizaciones/${moneda}`, {
    method: "PUT",
    body: await request.text(),
  });
}
