"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMovement } from "@/components/app-shell";

const MAXIMO = 2 * 1024 * 1024;

export function ImportDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const { refresh } = useMovement();
  const titleId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [arrastrando, setArrastrando] = useState(false);
  const [errores, setErrores] = useState<string[]>([]);
  const [pending, setPending] = useState(false);
  const profundidad = useRef(0);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !pending) {
        onClose();
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose, pending]);

  function elegir(file: File | null) {
    setErrores([]);

    if (!file) {
      setArchivo(null);
      return;
    }

    const mensaje = validarArchivo(file);
    setArchivo(mensaje ? null : file);

    if (mensaje) {
      setErrores([mensaje]);
    }
  }

  async function descargarFormato() {
    setErrores([]);
    const response = await fetch("/api/finanzas/importar/plantilla");

    if (response.status === 401) {
      router.replace("/login");
      return;
    }

    if (!response.ok) {
      setErrores(["No se pudo descargar el formato."]);
      return;
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "formato-movimientos.xlsx";
    link.click();
    URL.revokeObjectURL(url);
  }

  async function importar() {
    if (!archivo) {
      setErrores(["Elegí el archivo completado."]);
      return;
    }

    setPending(true);
    setErrores([]);

    try {
      const response = await fetch("/api/finanzas/importar", {
        method: "POST",
        headers: {
          "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
        body: await archivo.arrayBuffer(),
      });

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      const body = (await response.json().catch(() => null)) as {
        message?: unknown;
        error?: unknown;
        errores?: unknown;
      } | null;

      if (!response.ok) {
        setErrores(mensajes(body, response.status));
        setPending(false);
        return;
      }

      refresh();
      onClose();
    } catch {
      setErrores(["No se pudo importar el archivo."]);
      setPending(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !pending) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="max-h-[min(92dvh,44rem)] w-full overflow-y-auto rounded-t-2xl border border-black/10 bg-background p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-xl sm:max-w-md sm:rounded-2xl sm:p-6 dark:border-white/15"
      >
        <h2 id={titleId} className="text-lg font-semibold">
          Importar movimientos
        </h2>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Descargá el formato y completá la hoja Movimientos. Las columnas son Fecha, Tipo, Moneda
          y Monto. No lleva categoría: cada fila queda en Importado.
        </p>
        <button
          type="button"
          onClick={() => void descargarFormato()}
          disabled={pending}
          className="mt-4 cursor-pointer text-sm font-medium text-emerald-700 underline-offset-2 hover:underline disabled:opacity-60 dark:text-emerald-400"
        >
          Descargar formato
        </button>
        <div
          className={`mt-4 flex flex-col items-center gap-2 rounded-xl border border-dashed px-4 py-8 text-center text-sm ${
            arrastrando
              ? "border-emerald-600 bg-emerald-600/5"
              : "border-black/15 dark:border-white/20"
          }`}
          onDragEnter={(event) => {
            event.preventDefault();
            profundidad.current += 1;
            setArrastrando(true);
          }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={() => {
            profundidad.current -= 1;

            if (profundidad.current <= 0) {
              profundidad.current = 0;
              setArrastrando(false);
            }
          }}
          onDrop={(event) => {
            event.preventDefault();
            profundidad.current = 0;
            setArrastrando(false);
            elegir(event.dataTransfer.files[0] ?? null);
          }}
        >
          <p className="text-zinc-500 dark:text-zinc-400">
            {archivo ? archivo.name : "Arrastrá el Excel acá"}
          </p>
          <button
            type="button"
            disabled={pending}
            onClick={() => inputRef.current?.click()}
            className="cursor-pointer rounded-lg border border-black/10 px-3 py-2 text-xs font-medium disabled:opacity-60 dark:border-white/15"
          >
            Elegir archivo
          </button>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="hidden"
            onChange={(event) => {
              elegir(event.target.files?.[0] ?? null);
              event.target.value = "";
            }}
          />
        </div>
        {errores.length > 0 ? (
          <ul className="mt-4 flex flex-col gap-1 text-sm text-red-600 dark:text-red-400" role="alert">
            {errores.map((error, index) => (
              <li key={`${index}-${error}`}>{error}</li>
            ))}
          </ul>
        ) : null}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={onClose}
            className="cursor-pointer rounded-lg px-3 py-2 text-sm disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={pending || !archivo}
            onClick={() => void importar()}
            className="cursor-pointer rounded-lg bg-foreground px-3 py-2 text-sm font-medium text-background disabled:opacity-60"
          >
            {pending ? "Importando…" : "Importar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function validarArchivo(file: File) {
  if (!file.name.toLowerCase().endsWith(".xlsx")) {
    return "Subí un archivo .xlsx con el formato descargado.";
  }

  if (file.size === 0) {
    return "El archivo está vacío.";
  }

  if (file.size > MAXIMO) {
    return "El archivo supera los 2 MB.";
  }

  return null;
}

function mensajes(
  body: { message?: unknown; error?: unknown; errores?: unknown } | null,
  status: number,
) {
  if (status === 403) {
    return ["No tenés permiso para importar movimientos."];
  }

  const lista = Array.isArray(body?.errores)
    ? body.errores.filter((item): item is string => typeof item === "string" && item.length > 0)
    : [];

  if (lista.length > 0) {
    return lista;
  }

  if (typeof body?.message === "string" && body.message) {
    return [body.message];
  }

  if (typeof body?.error === "string" && body.error) {
    return [body.error];
  }

  return ["No se pudo importar el archivo."];
}
