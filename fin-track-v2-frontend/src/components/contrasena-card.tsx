"use client";

import { useState } from "react";
import { Button } from "@/components/button";
import { SETTINGS_CARD_CLASS, SETTINGS_INPUT_CLASS } from "@/components/settings-styles";

export function ContrasenaCard() {
  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function guardar() {
    if (nueva !== confirmacion) {
      setError("Las contraseñas no coinciden.");
      setOk(null);
      return;
    }

    setPending(true);
    setError(null);
    setOk(null);
    const response = await fetch("/api/auth/contrasena", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ actual, nueva }),
    });
    setPending(false);

    if (response.status === 401) {
      window.location.assign("/login");
      return;
    }

    if (response.status === 204) {
      setActual("");
      setNueva("");
      setConfirmacion("");
      setOk("La contraseña se actualizó.");
      return;
    }

    const body = (await response.json().catch(() => null)) as { message?: unknown } | null;
    setError(typeof body?.message === "string" ? body.message : "No se pudo cambiar la contraseña.");
  }

  return (
    <section className={SETTINGS_CARD_CLASS} aria-labelledby="cambiar-contrasena">
      <h2 id="cambiar-contrasena" className="text-base font-semibold">
        Contraseña
      </h2>
      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
        La nueva contraseña reemplaza a la actual para este usuario.
      </p>
      <form
        className="mt-4 flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          void guardar();
        }}
      >
        <label className="flex flex-col gap-2 text-sm font-medium">
          Contraseña actual
          <input
            type="password"
            name="actual"
            autoComplete="current-password"
            value={actual}
            disabled={pending}
            onChange={(event) => {
              setActual(event.target.value);
              setError(null);
              setOk(null);
            }}
            className={SETTINGS_INPUT_CLASS}
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium">
          Nueva contraseña
          <input
            type="password"
            name="nueva"
            autoComplete="new-password"
            value={nueva}
            disabled={pending}
            onChange={(event) => {
              setNueva(event.target.value);
              setError(null);
              setOk(null);
            }}
            className={SETTINGS_INPUT_CLASS}
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium">
          Repetir contraseña
          <input
            type="password"
            name="confirmacion"
            autoComplete="new-password"
            value={confirmacion}
            disabled={pending}
            onChange={(event) => {
              setConfirmacion(event.target.value);
              setError(null);
              setOk(null);
            }}
            className={SETTINGS_INPUT_CLASS}
          />
        </label>
        <div>
          <Button
            type="submit"
            variant="primary"
            disabled={pending || actual === "" || nueva === "" || confirmacion === ""}
          >
            {pending ? "Guardando…" : "Cambiar contraseña"}
          </Button>
        </div>
      </form>
      {error ? (
        <p className="mt-4 text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}
      {ok ? (
        <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400" role="status">
          {ok}
        </p>
      ) : null}
    </section>
  );
}
