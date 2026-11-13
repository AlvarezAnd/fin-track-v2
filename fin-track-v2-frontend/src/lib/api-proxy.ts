import { NextResponse } from "next/server";
import { apiFetch } from "@/lib/session";

type ApiResult = Awaited<ReturnType<typeof apiFetch>>;

export function proxyResult(result: ApiResult) {
  if (!result.ok) {
    const status = result.reason === "unauthorized" ? 401 : 503;
    const error =
      result.reason === "unauthorized"
        ? "La sesión venció."
        : "El servidor no está disponible.";

    return NextResponse.json({ error }, { status });
  }

  if (result.response.status === 204) {
    return new NextResponse(null, { status: 204 });
  }

  return result.response.text().then((body) => {
    return new NextResponse(body, {
      status: result.response.status,
      headers: {
        "content-type":
          result.response.headers.get("content-type") ?? "application/json",
      },
    });
  });
}

export async function proxyApi(path: string, init?: RequestInit) {
  return proxyResult(await apiFetch(path, init));
}

export async function proxyFile(path: string) {
  const result = await apiFetch(path);

  if (!result.ok) {
    return proxyResult(result);
  }

  const headers = new Headers();
  const type = result.response.headers.get("content-type");
  const disposition = result.response.headers.get("content-disposition");

  if (type) {
    headers.set("content-type", type);
  }

  if (disposition) {
    headers.set("content-disposition", disposition);
  }

  return new NextResponse(await result.response.arrayBuffer(), {
    status: result.response.status,
    headers,
  });
}
