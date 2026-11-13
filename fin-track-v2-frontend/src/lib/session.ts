import { cookies } from "next/headers";

const ACCESS_COOKIE = "access_token";
const REFRESH_COOKIE = "refresh_token";
const REFRESH_MAX_AGE = 60 * 60 * 24 * 30;

export type SessionUser = {
  username: string;
  roles: string[];
};

type TokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
};

type SignInResult =
  | { ok: true }
  | { ok: false; reason: "invalid" | "unconfigured" | "unavailable" };

type SignUpResult =
  | { ok: true }
  | { ok: false; reason: "invalid" | "taken" | "unconfigured" | "unavailable"; message?: string };

function backendUrl(path: string) {
  const base = process.env.BACKEND_URL ?? "http://localhost:3001";
  return new URL(path, base.endsWith("/") ? base : `${base}/`).toString();
}

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge,
  };
}

async function storeTokens(tokens: TokenResponse) {
  const cookieStore = await cookies();
  cookieStore.set(
    ACCESS_COOKIE,
    tokens.access_token,
    cookieOptions(tokens.expires_in),
  );
  cookieStore.set(
    REFRESH_COOKIE,
    tokens.refresh_token,
    cookieOptions(REFRESH_MAX_AGE),
  );
}

async function clearTokenCookies() {
  const cookieStore = await cookies();
  cookieStore.delete(ACCESS_COOKIE);
  cookieStore.delete(REFRESH_COOKIE);
}

async function requestTokens(path: string, body: unknown) {
  const response = await fetch(backendUrl(path), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  return response;
}

async function currentUser(accessToken: string): Promise<SessionUser | null> {
  const response = await fetch(backendUrl("/auth/me"), {
    headers: { authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  const body = (await response.json()) as { username?: unknown; roles?: unknown };
  const roles = Array.isArray(body.roles)
    ? body.roles.filter((role): role is string => typeof role === "string")
    : [];

  if (typeof body.username !== "string" || !body.username) {
    return null;
  }

  return { username: body.username, roles };
}

export async function signUp(
  username: string,
  password: string,
): Promise<SignUpResult> {
  let response: Response;

  try {
    response = await requestTokens("/auth/signup", { username, password });
  } catch {
    return { ok: false, reason: "unavailable" };
  }

  if (response.status === 409) {
    return { ok: false, reason: "taken" };
  }

  if (response.status === 400) {
    const body = (await response.json().catch(() => null)) as { message?: unknown } | null;
    const message = typeof body?.message === "string" ? body.message : undefined;
    return { ok: false, reason: "invalid", message };
  }

  if (response.status === 503) {
    return { ok: false, reason: "unconfigured" };
  }

  if (!response.ok) {
    return { ok: false, reason: "unavailable" };
  }

  return { ok: true };
}

export async function signIn(
  username: string,
  password: string,
): Promise<SignInResult> {
  let response: Response;

  try {
    response = await requestTokens("/auth/token", { username, password });
  } catch {
    return { ok: false, reason: "unavailable" };
  }

  if (response.status === 401) {
    return { ok: false, reason: "invalid" };
  }

  if (response.status === 503) {
    return { ok: false, reason: "unconfigured" };
  }

  if (!response.ok) {
    return { ok: false, reason: "unavailable" };
  }

  await storeTokens((await response.json()) as TokenResponse);
  return { ok: true };
}

export async function readSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_COOKIE)?.value;

  if (accessToken) {
    try {
      const user = await currentUser(accessToken);
      if (user) {
        return user;
      }
    } catch {
      return null;
    }
  }

  if (cookieStore.get(REFRESH_COOKIE)?.value) {
    const { redirect } = await import("next/navigation");
    redirect("/api/auth/refresh");
  }

  return null;
}

export async function refreshSession() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(REFRESH_COOKIE)?.value;

  if (!refreshToken) {
    return false;
  }

  try {
    const response = await requestTokens("/auth/token/refresh", {
      refresh_token: refreshToken,
    });

    if (!response.ok) {
      await clearTokenCookies();
      return false;
    }

    await storeTokens((await response.json()) as TokenResponse);
    return true;
  } catch {
    return false;
  }
}

export async function apiFetch(path: string, init?: RequestInit) {
  const headers = new Headers(init?.headers);

  if (init?.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  async function send(token: string) {
    headers.set("authorization", `Bearer ${token}`);
    return fetch(backendUrl(path), {
      ...init,
      headers,
      cache: "no-store",
    });
  }

  try {
    const cookieStore = await cookies();
    let accessToken = cookieStore.get(ACCESS_COOKIE)?.value;

    if (!accessToken) {
      if (!(await refreshSession())) {
        return { ok: false as const, reason: "unauthorized" as const };
      }

      accessToken = (await cookies()).get(ACCESS_COOKIE)?.value;
    }

    if (!accessToken) {
      return { ok: false as const, reason: "unauthorized" as const };
    }

    let response = await send(accessToken);

    if (response.status === 401 && (await refreshSession())) {
      const nextToken = (await cookies()).get(ACCESS_COOKIE)?.value;

      if (nextToken) {
        response = await send(nextToken);
      }
    }

    if (response.status === 401) {
      return { ok: false as const, reason: "unauthorized" as const };
    }

    return { ok: true as const, response };
  } catch {
    return { ok: false as const, reason: "unavailable" as const };
  }
}

export async function signOut() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(REFRESH_COOKIE)?.value;

  if (refreshToken) {
    try {
      await requestTokens("/auth/token/revoke", {
        refresh_token: refreshToken,
      });
    } catch {
      // The local cookies still have to go, even if the API is unreachable.
    }
  }

  await clearTokenCookies();
}
