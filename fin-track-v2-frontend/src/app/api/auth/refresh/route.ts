import { NextResponse } from "next/server";
import { refreshSession } from "@/lib/session";

export async function GET(request: Request) {
  const refreshed = await refreshSession();
  const destination = refreshed ? "/dashboard" : "/login";
  return NextResponse.redirect(new URL(destination, request.url));
}
