import type { EntregaCompletada } from "./types";

// Datos de ejemplo — reemplazar por una consulta a Supabase cuando exista la tabla `entregas`.
export const mockHistorialHoy: EntregaCompletada[] = [
  {
    id: "h1",
    codigo: "PD-4809",
    empresa: "Burritos El Paso",
    zona: "Laureles",
    pago: 7200,
    hora: "11:42",
  },
  {
    id: "h2",
    codigo: "PD-4815",
    empresa: "Farmacia Central",
    zona: "El Poblado",
    pago: 5500,
    hora: "12:58",
  },
];
