import { NextResponse } from "next/server";
import { proxyFile } from "@/lib/api-proxy";

const FORMATOS = new Set(["csv", "excel", "pdf"]);

type Context = {
  params: Promise<{ formato: string }>;
};

export async function GET(_request: Request, context: Context) {
  const { formato } = await context.params;

  if (!FORMATOS.has(formato)) {
    return NextResponse.json(
      { error: "El formato de exportación no es válido." },
      { status: 400 },
    );
  }

  return proxyFile(`/transacciones/exportar/${formato}`);
}
