export type Empresa = {
  id: string;
  nombre: string;
  categoria: string;
  zona: string;
  tiempoMin: number;
  tiempoMax: number;
  costoDomicilio: number;
};

export type EstadoPedido = "preparando" | "en_camino" | "entregado";

export type PedidoActivo = {
  codigo: string;
  empresa: string;
  estado: EstadoPedido;
};
