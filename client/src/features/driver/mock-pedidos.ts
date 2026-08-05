import type { PedidoDisponible } from "./types";

// Datos de ejemplo — reemplazar por una consulta a Supabase cuando exista la tabla `pedidos`.
export const mockPedidosDisponibles: PedidoDisponible[] = [
  {
    id: "1",
    codigo: "PD-4821",
    empresa: "Arepería La 14",
    zona: "El Poblado",
    direccion: "Cra 43A #10-15",
    distanciaKm: 1.2,
    pago: 6500,
  },
  {
    id: "2",
    codigo: "PD-4822",
    empresa: "Sushi Ocho",
    zona: "Laureles",
    direccion: "Cl 33 #76-20",
    distanciaKm: 2.8,
    pago: 8200,
  },
  {
    id: "3",
    codigo: "PD-4823",
    empresa: "Panadería San Roque",
    zona: "Envigado",
    direccion: "Cra 42 #35-10",
    distanciaKm: 0.6,
    pago: 5000,
  },
];
