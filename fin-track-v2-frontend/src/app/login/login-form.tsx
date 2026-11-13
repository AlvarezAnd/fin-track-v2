"use client";

import { useState } from "react";
import { useActionState } from "react";
import { Button } from "@/components/button";
import { EyeIcon } from "@/components/icons/eye-icon";
import { EyeOffIcon } from "@/components/icons/eye-off-icon";
import { LoadingScreen } from "@/components/loading-screen";
import { login, signup, type LoginState } from "./actions";

const initialState: LoginState = {};

const fieldClassName =
  "h-12 w-full rounded-lg border border-black/10 bg-transparent py-0 pr-11 pl-3 text-base font-normal outline-none focus:border-foreground sm:h-11 dark:border-white/15";

export function LoginForm() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [loginState, loginAction, loginPending] = useActionState(login, initialState);
  const [signupState, signupAction, signupPending] = useActionState(signup, initialState);
  const signingUp = mode === "signup";
  const state = signingUp ? signupState : loginState;
  const pending = signingUp ? signupPending : loginPending;

  return (
    <div className="flex flex-1 items-center justify-center pt-10 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pb-[max(2.5rem,env(safe-area-inset-bottom))] sm:px-6 sm:pt-16 sm:pb-[max(4rem,env(safe-area-inset-bottom))]">
      {pending ? (
        <LoadingScreen
          overlay
          label={signingUp ? "Creando cuenta…" : "Ingresando…"}
        />
      ) : null}
      <main className="w-full max-w-sm">
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
          Fin Track
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
          {signingUp ? "Crear cuenta" : "Ingresar"}
        </h1>
        <form className="mt-8 flex flex-col gap-5" action={signingUp ? signupAction : loginAction}>
          <label className="flex flex-col gap-2 text-sm font-medium">
            Nombre de usuario
            <input
              name="username"
              type="text"
              autoComplete="username"
              required
              className="h-12 rounded-lg border border-black/10 bg-transparent px-3 text-base font-normal outline-none focus:border-foreground sm:h-11 dark:border-white/15"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium">
            Contraseña
            <span className="relative">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete={signingUp ? "new-password" : "current-password"}
                required
                className={fieldClassName}
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                aria-pressed={showPassword}
                className="absolute top-1/2 right-2 flex size-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-zinc-500 hover:text-foreground dark:text-zinc-400"
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </span>
          </label>
          {signingUp ? (
            <label className="flex flex-col gap-2 text-sm font-medium">
              Repetir contraseña
              <input
                name="confirmation"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                className="h-12 rounded-lg border border-black/10 bg-transparent px-3 text-base font-normal outline-none focus:border-foreground sm:h-11 dark:border-white/15"
              />
            </label>
          ) : null}
          {state.error ? (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {state.error}
            </p>
          ) : null}
          <Button type="submit" variant="primary" disabled={pending} className="mt-1 w-full">
            {signingUp
              ? pending
                ? "Creando cuenta…"
                : "Crear cuenta"
              : pending
                ? "Ingresando…"
                : "Ingresar"}
          </Button>
        </form>
        <button
          type="button"
          className="mt-4 text-sm text-zinc-500 underline-offset-4 hover:underline dark:text-zinc-400"
          onClick={() => {
            setMode(signingUp ? "login" : "signup");
            setShowPassword(false);
          }}
        >
          {signingUp ? "Ya tengo cuenta" : "Crear cuenta"}
        </button>
      </main>
    </div>
  );
}
