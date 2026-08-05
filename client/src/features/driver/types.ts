export type PedidoDisponible = {
  id: string;
  codigo: string;
  empresa: string;
  zona: string;
  direccion: string;
  distanciaKm: number;
  pago: number;
};

export type EstadoEntrega = "recogiendo" | "en_ruta" | "entregado";

export type EntregaActiva = {
  pedido: PedidoDisponible;
  estado: EstadoEntrega;
};

export type EntregaCompletada = {
  id: string;
  codigo: string;
  empresa: string;
  zona: string;
  pago: number;
  hora: string;
};
