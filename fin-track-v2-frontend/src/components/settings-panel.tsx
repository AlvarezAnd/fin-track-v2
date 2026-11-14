"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { useAdministrador } from "@/components/app-shell";
import { CambioMoneda } from "@/components/cambio-moneda";
import { ContrasenaCard } from "@/components/contrasena-card";
import { useDisplaySettings } from "@/components/display-settings";
import { MonedaSelect } from "@/components/moneda-select";
import { Section } from "@/components/section";
import { SETTINGS_CARD_CLASS } from "@/components/settings-styles";
import { Tabs } from "@/components/tabs";
import { UsersAdminCard } from "@/components/users-admin-card";
import { applyTheme, readTheme, subscribeTheme, type Theme } from "@/lib/theme";
import { MONEDAS, type Moneda } from "@/lib/display";

export function SettingsPanel() {
  const administrador = useAdministrador();
  const { preferencias, cambios, guardar, recargarCambios } = useDisplaySettings();
  const [theme, setTheme] = useState<Theme>("system");
  const [moneda, setMoneda] = useState<Moneda>(preferencias.moneda);
  const [error, setError] = useState<string | null>(null);

  useLayoutEffect(() => {
    setTheme(readTheme());
    return subscribeTheme(() => setTheme(readTheme()));
  }, []);

  useEffect(() => {
    setMoneda(preferencias.moneda);
  }, [preferencias]);

  function chooseTheme(next: Theme) {
    applyTheme(next);
    setTheme(next);
  }

  function chooseMoneda(next: Moneda) {
    setMoneda(next);
    setError(null);
    guardar({ moneda: next });

    if (next !== "USD" && cambios[next] == null) {
      setError("Todavía no hay un cambio cargado para esa moneda. Los totales siguen en dólares.");
    }
  }

  return (
    <Section title="Configuración">
      <section className={SETTINGS_CARD_CLASS} aria-labelledby="color-tema">
        <h2 id="color-tema" className="text-base font-semibold">
          Color del tema
        </h2>
        <div className="mt-4">
          <Tabs
            label="Color del tema"
            value={theme}
            onChange={chooseTheme}
            options={[
              { id: "light", label: "Claro" },
              { id: "dark", label: "Oscuro" },
              { id: "system", label: "Del sistema" },
            ]}
          />
        </div>
      </section>
      <ContrasenaCard />
      {administrador ? <UsersAdminCard /> : null}
      <section className={SETTINGS_CARD_CLASS} aria-labelledby="moneda-mostrar">
        <h2 id="moneda-mostrar" className="text-base font-semibold">
          Moneda para mostrar
        </h2>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Cada movimiento queda en su moneda. Los totales están en dólares y, si hay cambio
          cargado, se muestran en la moneda elegida.
        </p>
        <div className="mt-4 flex flex-col gap-2 text-sm font-medium">
          <span id="moneda-etiqueta">Moneda</span>
          <MonedaSelect
            value={moneda}
            labelledBy="moneda-etiqueta"
            onChange={chooseMoneda}
          />
        </div>
        {error ? (
          <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400" role="status">
            {error}
          </p>
        ) : null}
      </section>
      <section className={SETTINGS_CARD_CLASS} aria-labelledby="cambios-moneda">
        <h2 id="cambios-moneda" className="text-base font-semibold">
          Cambios
        </h2>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          El dólar es la referencia. Cada valor indica cuántas unidades de esa moneda equivalen a 1 USD.
          {administrador ? "" : " Solo un administrador puede modificarlos."}
        </p>
        <ul className="mt-4 flex flex-col gap-4">
          {MONEDAS.filter((item) => item.id !== "USD").map((item) => (
            <CambioMoneda
              key={item.id}
              moneda={item.id}
              nombre={item.nombre}
              valor={cambios[item.id]}
              editable={administrador}
              onSaved={recargarCambios}
            />
          ))}
        </ul>
      </section>
    </Section>
  );
}
