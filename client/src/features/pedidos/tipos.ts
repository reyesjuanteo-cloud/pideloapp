// Estados del ciclo de vida de un pedido. Un solo modelo compartido por las
// vistas de cliente y domiciliario:
//   buscando   → el cliente pidió; ningún domiciliario lo ha tomado
//   preparando → un domiciliario lo aceptó y está recogiéndolo
//   en_camino  → el domiciliario va hacia el cliente
//   llegue     → el domiciliario marcó "Ya llegué"; falta que el cliente confirme
//   entregado  → el cliente confirmó que lo recibió
export type EstadoPedido =
  | "buscando"
  | "preparando"
  | "en_camino"
  | "llegue"
  | "entregado"
  | "cancelado";

export type ItemPedido = {
  productoId: string;
  nombre: string;
  precio: number;
  cantidad: number;
};

export type Pedido = {
  id: string;
  codigo: string;
  tipo: "catalogo" | "libre";
  comercio: string; // nombre del comercio, o "Pedido libre"
  items: ItemPedido[];
  descripcionLibre?: string;
  subtotal: number;
  envio: number;
  total: number;
  direccion: string;
  barrio: string;
  // Coordenadas del punto de entrega (el pin del mapa es la fuente de verdad).
  lat?: number;
  lng?: number;
  estado: EstadoPedido;
  horaCreacion: string;
  horaEntrega?: string;
  // Datos del mensajero asignado (visibles para el cliente de este pedido)
  mensajeroNombre?: string;
  mensajeroVehiculo?: "moto" | "bicicleta";
  mensajeroPlaca?: string;
  // Nombre del cliente (visible para el mensajero de la entrega). El teléfono
  // NO se expone a propósito: se hablan por el chat y la llamada de la app.
  clienteNombre?: string;
};
