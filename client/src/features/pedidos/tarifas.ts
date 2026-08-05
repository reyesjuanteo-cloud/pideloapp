// Modelo de negocio de Pídelo (acordado 2026-08-05):
// - El cliente paga $5.000 de envío, que van completos al mensajero.
// - El mensajero paga a Pídelo $1.000 de comisión por cada pedido que acepta,
//   descontada de un saldo prepagado.
// - Una recarga vale $5.000 y cubre 5 pedidos. Sin saldo no recibe pedidos.
export const TARIFA_ENVIO = 5000;
export const COMISION_PEDIDO = 1000;
export const RECARGA_VALOR = 5000;
export const RECARGA_PEDIDOS = RECARGA_VALOR / COMISION_PEDIDO;
