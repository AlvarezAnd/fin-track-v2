import type { CategoriaUsuario } from './assistant.validation.js';

export function buildTools(categorias: CategoriaUsuario[]) {
  const nombres = [...new Set(categorias.map((categoria) => categoria.nombre))];

  return [
    {
      type: 'function' as const,
      function: {
        name: 'reporte_movimientos',
        description:
          'Totales en dólares de egresos o ingresos del usuario, agrupados por categoría o por mes, ' +
          'para los últimos N meses. Úsala para cualquier pedido de gastos, ingresos, reportes o comparaciones.',
        parameters: {
          type: 'object',
          properties: {
            tipo: {
              type: 'string',
              enum: ['egreso', 'ingreso'],
              description: "Por defecto 'egreso'. Los 'gastos' son egresos.",
            },
            categorias: {
              type: 'array',
              items: nombres.length > 0 ? { type: 'string', enum: nombres } : { type: 'string' },
              description: 'Categorías a incluir. Vacío significa todas las del tipo pedido.',
            },
            meses: {
              type: 'integer',
              minimum: 1,
              maximum: 24,
              description: 'Meses hacia atrás desde hoy, incluyendo el mes actual.',
            },
            agrupar_por: {
              type: 'string',
              enum: ['categoria', 'mes'],
              description: 'Cómo presentar el resultado.',
            },
          },
          required: ['meses'],
        },
      },
    },
  ];
}
