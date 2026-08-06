"use client";

// Almacén de pedidos respaldado por Supabase con Realtime: un pedido creado
// en un celular aparece en el del mensajero al instante. RLS decide qué ve
// cada quien (cliente: los suyos; mensajero aprobado: los disponibles y los
// que tomó; admin: todos).
import { asegurarSesion, supabase } from "@/lib/supabase/cliente";
import { crearRecursoRemoto } from "@/lib/recurso-remoto";
import type { EstadoPedido, ItemPedido, Pedido } from "./tipos";

type FilaPedido = {
  id: string;
  codigo: string;
  tipo: "catalogo" | "libre";
  descripcion_libre: string | null;
  items: ItemPedido[];
  subtotal: number;
  envio: number;
  total: number;
  direccion: string;
  barrio: string | null;
  lat: number | null;
  lng: number | null;
  estado: EstadoPedido;
  creado_en: string;
  entregado_en: string | null;
  comercio_nombre: string | null;
  comercios: { nombre: string } | null;
  mensajeros: {
    vehiculo: "moto" | "bicicleta";
    placa: string | null;
    perfiles: { nombre: string | null; celular: string | null } | null;
  } | null;
  perfiles: { nombre: string | null; celular: string | null } | null;
};

function hora(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function aPedido(fila: FilaPedido): Pedido {
  return {
    id: fila.id,
    codigo: fila.codigo,
    tipo: fila.tipo,
    // El nombre queda guardado en el pedido: sobrevive si borran el comercio.
    comercio:
      fila.comercios?.nombre ??
      fila.comercio_nombre ??
      (fila.tipo === "libre" ? "Pedido libre" : "Comercio"),
    items: fila.items ?? [],
    descripcionLibre: fila.descripcion_libre ?? undefined,
    subtotal: fila.subtotal,
    envio: fila.envio,
    total: fila.total,
    direccion: fila.direccion,
    barrio: fila.barrio ?? "",
    lat: fila.lat ?? undefined,
    lng: fila.lng ?? undefined,
    estado: fila.estado,
    horaCreacion: hora(fila.creado_en),
    horaEntrega: fila.entregado_en ? hora(fila.entregado_en) : undefined,
    mensajeroNombre: fila.mensajeros?.perfiles?.nombre ?? undefined,
    mensajeroVehiculo: fila.mensajeros?.vehiculo,
    mensajeroPlaca: fila.mensajeros?.placa ?? undefined,
    mensajeroCelular: fila.mensajeros?.perfiles?.celular ?? undefined,
    clienteNombre: fila.perfiles?.nombre ?? undefined,
    clienteCelular: fila.perfiles?.celular ?? undefined,
  };
}

async function cargarPedidos(): Promise<Pedido[]> {
  const { data, error } = await supabase()
    .from("pedidos")
    .select("*, comercios(nombre), perfiles!pedidos_cliente_id_fkey(nombre, celular), mensajeros(vehiculo, placa, perfiles(nombre, celular))")
    .order("creado_en", { ascending: true });
  if (error) throw error;
  return (data as FilaPedido[]).map(aPedido);
}

const recurso = crearRecursoRemoto<Pedido[]>([], cargarPedidos);

// Realtime: cualquier cambio en la tabla refresca el almacén.
let canalIniciado = false;
function iniciarRealtime() {
  if (canalIniciado || typeof window === "undefined") return;
  canalIniciado = true;
  supabase()
    .channel("pedidos-cambios")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "pedidos" },
      () => void recurso.refrescar()
    )
    .subscribe();
}

export function usePedidos(): Pedido[] {
  iniciarRealtime();
  return recurso.useRecurso();
}

export function useEstadoPedidos() {
  iniciarRealtime();
  return recurso.useEstado();
}

export const refrescarPedidos = recurso.refrescar;

export async function crearPedido(datos: {
  tipo: "catalogo" | "libre";
  comercioId?: string;
  descripcionLibre?: string;
  items: ItemPedido[];
  subtotal: number;
  envio: number;
  total: number;
  direccion: string;
  barrio: string;
  lat?: number;
  lng?: number;
}): Promise<{ id: string }> {
  const usuario = await asegurarSesion();
  const codigo = `PD-${Math.floor(1000 + Math.random() * 9000)}`;
  const { data, error } = await supabase()
    .from("pedidos")
    .insert({
      codigo,
      tipo: datos.tipo,
      cliente_id: usuario.id,
      comercio_id: datos.comercioId ?? null,
      descripcion_libre: datos.descripcionLibre ?? null,
      items: datos.items,
      subtotal: datos.subtotal,
      envio: datos.envio,
      total: datos.total,
      direccion: datos.direccion,
      barrio: datos.barrio,
      lat: datos.lat ?? null,
      lng: datos.lng ?? null,
    })
    .select("id")
    .single();
  if (error) throw error;
  void recurso.refrescar();
  return { id: data.id as string };
}

// Transiciones del mensajero (en_camino, llegue) y del cliente (entregado).
// La aceptación (buscando → preparando) va por server action: descuenta saldo.
export async function actualizarEstado(
  id: string,
  estado: EstadoPedido
): Promise<void> {
  const { error } = await supabase()
    .from("pedidos")
    .update({
      estado,
      ...(estado === "entregado" ? { entregado_en: new Date().toISOString() } : {}),
    })
    .eq("id", id);
  if (error) throw error;
  void recurso.refrescar();
}
