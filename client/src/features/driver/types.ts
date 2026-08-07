export type PedidoDisponible = {
  id: string;
  codigo: string;
  comercio: string;
  zona: string;
  direccion: string;
  distanciaKm: number;
  pago: number;
  // Qué tiene que llevar: productos del catálogo o el encargo escrito
  tipo: "catalogo" | "libre";
  items: { nombre: string; cantidad: number }[];
  descripcionLibre?: string;
  totalPedido: number;
  // Cómo encontrar al cliente y dónde recoger
  indicaciones?: string;
  lat?: number;
  lng?: number;
  recogerEn?: string;
  recogerLat?: number;
  recogerLng?: number;
};

export type EstadoEntrega = "recogiendo" | "en_ruta" | "llegue" | "entregado";

export type EntregaActiva = {
  pedido: PedidoDisponible;
  estado: EstadoEntrega;
};

export type EntregaCompletada = {
  id: string;
  codigo: string;
  comercio: string;
  zona: string;
  pago: number;
  hora: string;
};
