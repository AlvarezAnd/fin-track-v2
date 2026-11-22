"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChatMarkdown } from "@/components/chat-markdown";
import { useDisplaySettings } from "@/components/display-settings";
import { ChatIcon } from "@/components/icons/chat-icon";
import { CloseIcon } from "@/components/icons/close-icon";
import { formatMoneda, monedaDe } from "@/lib/display";
import {
  formatFecha,
  formatMes,
  mesActual,
  mesAnterior,
  type Movimiento,
  type PanelFinanciero,
} from "@/lib/finance";

type Mensaje = {
  id: number;
  autor: "asistente" | "usuario";
  texto: string;
};

type Totales = (movimientos: Movimiento[]) => {
  ingresos: number;
  egresos: number;
  balance: number;
};

const SUGERENCIAS = ["Balance del mes", "Ingresos y egresos", "Últimos movimientos"];

const SALUDO =
  "Hola. Puedo armar reportes de tus movimientos o consultar el balance, los ingresos, los egresos y los últimos movimientos.";

export function Chatbot() {
  const router = useRouter();
  const { format, totales } = useDisplaySettings();
  const panelId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [texto, setTexto] = useState("");
  const [pending, setPending] = useState(false);
  const [mensajes, setMensajes] = useState<Mensaje[]>([
    { id: 0, autor: "asistente", texto: SALUDO },
  ]);

  useEffect(() => {
    if (!open) {
      return;
    }

    inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    endRef.current?.scrollIntoView({ block: "end" });
  }, [mensajes, open, pending]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function enviar(pregunta: string) {
    const consulta = pregunta.trim();

    if (!consulta || pending) {
      return;
    }

    setTexto("");
    setPending(true);
    setMensajes((actual) => [
      ...actual,
      { id: actual.length, autor: "usuario", texto: consulta },
    ]);

    const historial = [
      ...mensajes
        .filter((mensaje) => mensaje.id !== 0)
        .map((mensaje) => ({
          role: mensaje.autor === "usuario" ? ("user" as const) : ("assistant" as const),
          content: mensaje.texto,
        })),
      { role: "user" as const, content: consulta },
    ];
    const respuesta = await preguntar(historial, format, totales);

    if (respuesta === "auth") {
      router.replace("/login");
      return;
    }

    setMensajes((actual) => [
      ...actual,
      { id: actual.length, autor: "asistente", texto: respuesta },
    ]);
    setPending(false);
  }

  return (
    <div className="fixed right-[max(1rem,env(safe-area-inset-right))] bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-40 flex flex-col items-end gap-3 xl:bottom-6">
      {open ? (
        <section
          id={panelId}
          role="dialog"
          aria-label="Asistente"
          aria-modal="true"
          className="fixed inset-0 z-50 flex h-dvh w-full flex-col overflow-hidden border-0 bg-background pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] sm:static sm:z-auto sm:h-auto sm:max-h-[min(32rem,calc(100dvh-9rem))] sm:w-[min(22rem,calc(100vw-2rem))] sm:rounded-2xl sm:border sm:border-black/10 sm:pt-0 sm:pb-0 sm:shadow-xl dark:sm:border-white/15"
        >
          <header className="flex items-center justify-between gap-3 border-b border-black/10 px-4 py-3 dark:border-white/10">
            <div>
              <h2 className="text-sm font-semibold">Asistente</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Tus movimientos</p>
            </div>
            <button
              type="button"
              aria-label="Cerrar asistente"
              onClick={() => setOpen(false)}
              className="cursor-pointer rounded-md p-1.5 text-zinc-500 hover:bg-black/[.04] hover:text-foreground dark:hover:bg-white/[.06]"
            >
              <CloseIcon />
            </button>
          </header>
          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4">
            {mensajes.map((mensaje) => (
              <div
                key={mensaje.id}
                className={`min-w-0 rounded-2xl px-3 py-2 text-sm ${
                  mensaje.autor === "usuario"
                    ? "max-w-[85%] self-end bg-foreground whitespace-pre-wrap text-background"
                    : "max-w-full self-start bg-neutral-200/60 dark:bg-neutral-900"
                }`}
              >
                {mensaje.autor === "usuario" ? (
                  mensaje.texto
                ) : (
                  <ChatMarkdown texto={mensaje.texto} />
                )}
              </div>
            ))}
            {pending ? (
              <p className="self-start rounded-2xl bg-neutral-200/60 px-3 py-2 text-sm text-zinc-500 dark:bg-neutral-900 dark:text-zinc-400">
                Consultando…
              </p>
            ) : null}
            {mensajes.length === 1 && !pending ? (
              <div className="flex flex-wrap gap-2">
                {SUGERENCIAS.map((sugerencia) => (
                  <button
                    key={sugerencia}
                    type="button"
                    onClick={() => void enviar(sugerencia)}
                    className="cursor-pointer rounded-full border border-black/10 px-3 py-1.5 text-xs hover:bg-black/[.04] dark:border-white/15 dark:hover:bg-white/[.06]"
                  >
                    {sugerencia}
                  </button>
                ))}
              </div>
            ) : null}
            <div ref={endRef} />
          </div>
          <form
            className="flex gap-2 border-t border-black/10 p-3 dark:border-white/10"
            onSubmit={(event) => {
              event.preventDefault();
              void enviar(texto);
            }}
          >
            <input
              ref={inputRef}
              value={texto}
              onChange={(event) => setTexto(event.target.value)}
              placeholder="Preguntá por tu balance…"
              disabled={pending}
              className="h-11 min-w-0 flex-1 rounded-lg border border-black/10 bg-transparent px-3 text-sm outline-none focus:border-foreground disabled:opacity-60 dark:border-white/15"
            />
            <button
              type="submit"
              disabled={pending || texto.trim() === ""}
              className="cursor-pointer rounded-lg bg-foreground px-3 text-sm font-medium text-background disabled:cursor-default disabled:opacity-60"
            >
              Enviar
            </button>
          </form>
        </section>
      ) : null}
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? "Cerrar asistente" : "Abrir asistente"}
        onClick={() => setOpen((actual) => !actual)}
        className={`size-14 cursor-pointer items-center justify-center rounded-full bg-foreground text-background shadow-lg ${open ? "hidden sm:flex" : "flex"}`}
      >
        {open ? <CloseIcon className="size-6" /> : <ChatIcon />}
      </button>
    </div>
  );
}

async function preguntar(
  historial: Array<{ role: "user" | "assistant"; content: string }>,
  format: (value: number) => string,
  totales: Totales,
): Promise<string | "auth"> {
  const pregunta = historial.at(-1)?.content ?? "";
  let response: Response;

  try {
    response = await fetch("/api/asistente/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ messages: historial.slice(-8) }),
      cache: "no-store",
    });
  } catch {
    return consultar(pregunta, format, totales);
  }

  if (response.status === 401) {
    return "auth";
  }

  if (response.status === 429) {
    const body = (await response.json().catch(() => null)) as { message?: unknown } | null;
    return typeof body?.message === "string"
      ? body.message
      : "El asistente está ocupado, intenta en un minuto.";
  }

  const body = (await response.json().catch(() => null)) as {
    respuesta?: unknown;
    fallback?: unknown;
  } | null;

  if (!response.ok || body?.fallback || typeof body?.respuesta !== "string" || !body.respuesta) {
    return consultar(pregunta, format, totales);
  }

  return body.respuesta;
}

async function consultar(
  pregunta: string,
  format: (value: number) => string,
  totales: Totales,
): Promise<string | "auth"> {
  const text = pregunta.toLocaleLowerCase("es-AR");
  const mes = text.includes("pasado") || text.includes("anterior") ? mesAnterior() : mesActual();
  const response = await fetch(`/api/finanzas?mes=${mes}`, { cache: "no-store" });

  if (response.status === 401) {
    return "auth";
  }

  if (!response.ok) {
    return "No pude consultar los movimientos.";
  }

  const panel = (await response.json()) as PanelFinanciero;
  return responder(text, { ...panel, ...totales(panel.movimientos) }, format, totales);
}

function responder(
  text: string,
  panel: PanelFinanciero,
  format: (value: number) => string,
  totales: Totales,
) {
  const periodo = formatMes(panel.mes);
  const pideIngreso = text.includes("ingreso");
  const pideEgreso = text.includes("egreso") || text.includes("gasto");
  const pideBalance = text.includes("balance") || text.includes("saldo");
  const categoria = buscarCategoria(text, panel);

  if (categoria && !text.includes("categor")) {
    const movimientos = panel.movimientos.filter(
      (movimiento) =>
        movimiento.categoria.toLocaleLowerCase("es-AR") === categoria.toLocaleLowerCase("es-AR"),
    );
    const { ingresos, egresos } = totales(movimientos);
    const total = ingresos + egresos;

    return movimientos.length === 0
      ? `En ${periodo} no hay movimientos de ${categoria}.`
      : `En ${periodo}, ${categoria} suma ${format(total)} en ${cantidad(movimientos.length, "movimiento")}.`;
  }

  if ([pideIngreso, pideEgreso, pideBalance].filter(Boolean).length > 1) {
    return resumen(periodo, panel, format);
  }

  if (pideBalance) {
    return `El balance de ${periodo} es ${format(panel.balance)}.`;
  }

  if (pideIngreso) {
    return `Los ingresos de ${periodo} suman ${format(panel.ingresos)}.`;
  }

  if (pideEgreso) {
    return `Los egresos de ${periodo} suman ${format(panel.egresos)}.`;
  }

  if (text.includes("movimiento") || text.includes("historial") || text.includes("último") || text.includes("ultimo")) {
    return listarMovimientos(periodo, panel.movimientos);
  }

  if (text.includes("categor")) {
    return listarCategorias(panel);
  }

  if (text.includes("hola") || text.includes("ayuda")) {
    return SALUDO;
  }

  return "Puedo decirte el balance, los ingresos, los egresos, las categorías o los últimos movimientos. También podés nombrar una categoría o pedir el mes pasado.";
}

function resumen(periodo: string, panel: PanelFinanciero, format: (value: number) => string) {
  return `En ${periodo}:\nIngresos: ${format(panel.ingresos)}\nEgresos: ${format(panel.egresos)}\nBalance: ${format(panel.balance)}`;
}

function listarMovimientos(periodo: string, movimientos: Movimiento[]) {
  if (movimientos.length === 0) {
    return `En ${periodo} todavía no hay movimientos.`;
  }

  const lineas = movimientos.slice(0, 5).map((movimiento) => {
    const signo = movimiento.tipo === "ingreso" ? "+" : "−";
    return `${formatFecha(movimiento.fecha)} · ${movimiento.categoria} · ${signo}${formatMoneda(movimiento.monto, monedaDe(movimiento.moneda))}`;
  });
  const extra =
    movimientos.length > 5 ? `\nY ${movimientos.length - 5} más en este mes.` : "";

  return `Últimos movimientos de ${periodo}:\n${lineas.join("\n")}${extra}`;
}

function listarCategorias(panel: PanelFinanciero) {
  const ingresos = panel.categorias.ingreso.map((categoria) => categoria.nombre);
  const egresos = panel.categorias.egreso.map((categoria) => categoria.nombre);

  return `Ingresos: ${ingresos.length > 0 ? ingresos.join(", ") : "ninguna"}.\nEgresos: ${egresos.length > 0 ? egresos.join(", ") : "ninguna"}.`;
}

function buscarCategoria(text: string, panel: PanelFinanciero) {
  return [...panel.categorias.ingreso, ...panel.categorias.egreso]
    .map((categoria) => categoria.nombre)
    .filter((nombre) => nombre.length > 2 && text.includes(nombre.toLocaleLowerCase("es-AR")))
    .sort((a, b) => b.length - a.length)[0];
}

function cantidad(total: number, palabra: string) {
  return total === 1 ? `1 ${palabra}` : `${total} ${palabra}s`;
}
