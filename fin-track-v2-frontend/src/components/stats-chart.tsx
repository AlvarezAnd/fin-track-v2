"use client";

import { useDisplaySettings } from "@/components/display-settings";
import type { StatsPunto } from "@/components/stats-punto";

export function StatsChart({ puntos }: { puntos: StatsPunto[] }) {
  const { format } = useDisplaySettings();
  const width = 640;
  const height = 240;
  const pad = { left: 8, right: 8, top: 16, bottom: 36 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const max = Math.max(1, ...puntos.flatMap((punto) => [punto.ingresos, punto.egresos]));
  const group = innerW / Math.max(puntos.length, 1);
  const bar = Math.min(12, group * 0.28);
  const step = puntos.length > 12 ? Math.ceil(puntos.length / 8) : 1;

  return (
    <figure className="rounded-2xl border border-black/10 p-4 dark:border-white/15 bg-neutral-200/60 dark:bg-neutral-900">
      <figcaption className="mb-3 flex flex-wrap gap-4 text-sm">
        <span className="text-emerald-700 dark:text-emerald-400">Ingresos</span>
        <span className="text-rose-700 dark:text-rose-400">Egresos</span>
      </figcaption>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img">
        <title>Ingresos y egresos del período</title>
        {puntos.map((punto, index) => {
          const center = pad.left + group * index + group / 2;
          const ingresoH = (punto.ingresos / max) * innerH;
          const egresoH = (punto.egresos / max) * innerH;
          return (
            <g key={punto.clave}>
              <rect
                x={center - bar - 1}
                y={pad.top + innerH - ingresoH}
                width={bar}
                height={ingresoH}
                rx="2"
                className="fill-emerald-700 dark:fill-emerald-400"
              >
                <title>{`${punto.etiqueta}: ingresos ${format(punto.ingresos)}`}</title>
              </rect>
              <rect
                x={center + 1}
                y={pad.top + innerH - egresoH}
                width={bar}
                height={egresoH}
                rx="2"
                className="fill-rose-700 dark:fill-rose-400"
              >
                <title>{`${punto.etiqueta}: egresos ${format(punto.egresos)}`}</title>
              </rect>
              {index % step === 0 ? (
                <text
                  x={center}
                  y={height - 12}
                  textAnchor="middle"
                  className="fill-zinc-500 text-[11px] dark:fill-zinc-400"
                >
                  {punto.etiqueta}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
      <table className="sr-only">
        <caption>Ingresos y egresos del período</caption>
        <thead>
          <tr>
            <th>Período</th>
            <th>Ingresos</th>
            <th>Egresos</th>
            <th>Balance acumulado</th>
          </tr>
        </thead>
        <tbody>
          {puntos.map((punto) => (
            <tr key={punto.clave}>
              <td>{punto.etiqueta}</td>
              <td>{format(punto.ingresos)}</td>
              <td>{format(punto.egresos)}</td>
              <td>{format(punto.balance)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
