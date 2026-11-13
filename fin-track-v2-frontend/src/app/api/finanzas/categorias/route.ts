import { NextResponse } from "next/server";
import { proxyResult } from "@/lib/api-proxy";
import { apiFetch } from "@/lib/session";

export async function GET() {
  const [ingresos, egresos] = await Promise.all([
    apiFetch("/categorias?tipo=ingreso"),
    apiFetch("/categorias?tipo=egreso"),
  ]);

  if (!ingresos.ok || !ingresos.response.ok) {
    return proxyResult(ingresos);
  }

  if (!egresos.ok || !egresos.response.ok) {
    return proxyResult(egresos);
  }

  const [ingreso, egreso] = await Promise.all([
    ingresos.response.json(),
    egresos.response.json(),
  ]);

  return NextResponse.json({ ingreso, egreso });
}
