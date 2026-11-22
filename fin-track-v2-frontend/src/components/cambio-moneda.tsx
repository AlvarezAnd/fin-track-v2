"use client";

import { useState } from "react";
import { Button } from "@/components/button";
import { SETTINGS_INPUT_CLASS } from "@/components/settings-styles";
import { parseEquivalencia, type Moneda } from "@/lib/display";

function textoDe(valor: number | undefined) {
  return valor == null ? "" : valor.toLocaleString("es-AR", { maximumFractionDigits: 4 });
}

export function CambioMoneda({
  moneda,
  nombre,
  valor,
  editable,
  onSaved,
}: {
  moneda: Moneda;
  nombre: string;
  valor: number | undefined;
  editable: boolean;
  onSaved: () => Promise<void>;
}) {
  const [texto, setTexto] = useState(textoDe(valor));
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const [valorMostrado, setValorMostrado] = useState(valor);

  // When the stored rate changes, reload the field while rendering (no effect needed).
  if (valor !== valorMostrado) {
    setValorMostrado(valor);
    setTexto(textoDe(valor));
    setError(null);
  }

  async function guardar() {
    const rate = parseEquivalencia(texto);

    if (!rate) {
      setError("Indicá a cuántas unidades de esta moneda equivale 1 USD.");
      return;
    }

    setPending(true);
    const response = await fetch(`/api/finanzas/cotizaciones/${moneda}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ valor: rate }),
    });
    setPending(false);

    if (response.status === 401) {
      window.location.assign("/login");
      return;
    }

    if (!response.ok) {
      setError("No se pudo guardar el cambio.");
      return;
    }

    setError(null);
    await onSaved();
  }

  return (
    <li className="flex flex-col gap-2">
      <label className="text-sm font-medium" htmlFor={`cambio-${moneda}`}>
        {nombre}
      </label>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          id={`cambio-${moneda}`}
          inputMode="decimal"
          value={texto}
          disabled={!editable || pending}
          onChange={(event) => {
            setTexto(event.target.value);
            setError(null);
          }}
          placeholder="Sin cambio"
          aria-label={`Unidades de ${nombre} por dólar`}
          className={SETTINGS_INPUT_CLASS}
        />
        {editable ? (
          <Button variant="primary" disabled={pending} onClick={() => void guardar()}>
            Guardar
          </Button>
        ) : null}
      </div>
      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}
    </li>
  );
}
