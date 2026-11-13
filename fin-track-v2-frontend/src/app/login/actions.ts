"use server";

import { redirect } from "next/navigation";
import { signIn, signUp } from "@/lib/session";

export type LoginState = {
  error?: string;
};

export async function login(
  _state: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const result = await signIn(username, password);

  if (!result.ok) {
    return {
      error:
        result.reason === "unconfigured"
          ? "El acceso no está configurado."
          : result.reason === "unavailable"
            ? "No se pudo conectar con el servidor."
            : "Usuario o contraseña incorrectos.",
    };
  }

  redirect("/dashboard");
}

export async function signup(
  _state: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmation = String(formData.get("confirmation") ?? "");

  if (password !== confirmation) {
    return { error: "Las contraseñas no coinciden." };
  }

  const created = await signUp(username, password);

  if (!created.ok) {
    if (created.reason === "taken") {
      return { error: "Ya existe un usuario con ese nombre." };
    }

    if (created.reason === "invalid") {
      return { error: created.message ?? "Revisá el usuario y la contraseña." };
    }

    if (created.reason === "unconfigured") {
      return { error: "El registro no está disponible." };
    }

    return { error: "No se pudo conectar con el servidor." };
  }

  const result = await signIn(username, password);

  if (!result.ok) {
    return { error: "La cuenta se creó, pero no se pudo iniciar sesión." };
  }

  redirect("/dashboard");
}
