"use client";

// Almacén de pedidos respaldado por Supabase con Realtime: un pedido creado
// en un celular aparece en el del mensajero al instante. RLS decide qué ve
// cada quien (cliente: los suyos; mensajero aprobado: los disponibles y los
// que tomó; admin: todos).
import {
  asegurarSesion,
  esSesionHuerfana,
  reiniciarSesion,
  supabase,
} from "@/lib/supabase/cliente";
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
    perfiles: { nombre: string | null } | null;
  } | null;
  perfiles: { nombre: string | null } | null;
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
    clienteNombre: fila.perfiles?.nombre ?? undefined,
  };
}

async function cargarPedidos(): Promise<Pedido[]> {
  const { data, error } = await supabase()
    .from("pedidos")
    .select("*, comercios(nombre), perfiles!pedidos_cliente_id_fkey(nombre), mensajeros(vehiculo, placa, perfiles(nombre))")
    .order("creado_en", { ascending: true });
  if (error) throw error;
  return (data as FilaPedido[]).map(aPedido);
}

const recurso = crearRecursoRemoto<Pedido[]>([], cargarPedidos);

// Realtime: cualquier cambio en la tabla refresca el almacén.
//
// Dos detalles que lo hacían fallar en el panel del mensajero:
//   · Realtime aplica RLS con el token de la sesión: hay que pasárselo, si no
//     el mensajero no recibe los pedidos nuevos de otros clientes.
//   · Si el canal se cae (pantalla en segundo plano, cambio de red) hay que
//     reconectar y volver a consultar, o se queda con datos viejos.
let canalIniciado = false;

async function iniciarRealtime() {
  if (canalIniciado || typeof window === "undefined") return;
  canalIniciado = true;
  const sb = supabase();

  const {
    data: { session },
  } = await sb.auth.getSession();
  if (session) sb.realtime.setAuth(session.access_token);

  const canal = sb
    .channel("pedidos-cambios")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "pedidos" },
      () => void recurso.refrescar()
    )
    .subscribe((estado) => {
      // Al (re)conectar, traer lo que haya pasado mientras no escuchábamos.
      if (estado === "SUBSCRIBED") void recurso.refrescar();
    });

  // La sesión cambia (registro del mensajero, cierre de sesión): el canal
  // necesita el token nuevo para seguir viendo lo que le corresponde.
  sb.auth.onAuthStateChange((_evento, sesion) => {
    if (sesion) {
      sb.realtime.setAuth(sesion.access_token);
      void recurso.refrescar();
    }
  });

  // Red intermitente o app en segundo plano: refrescar al volver.
  window.addEventListener("online", () => void recurso.refrescar());
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") void recurso.refrescar();
  });

  void canal;
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
  let usuario = await asegurarSesion();
  const codigo = `PD-${Math.floor(1000 + Math.random() * 9000)}`;
  const fila = (uid: string) => ({
    codigo,
    tipo: datos.tipo,
    cliente_id: uid,
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
  });
  let { data, error } = await supabase()
    .from("pedidos")
    .insert(fila(usuario.id))
    .select("id")
    .single();
  if (esSesionHuerfana(error)) {
    // La sesión apuntaba a un usuario borrado: se crea otra y se reintenta.
    usuario = await reiniciarSesion();
    await supabase().from("perfiles").upsert({ id: usuario.id });
    ({ data, error } = await supabase()
      .from("pedidos")
      .insert(fila(usuario.id))
      .select("id")
      .single());
  }
  if (error || !data) throw error ?? new Error("No se pudo crear el pedido");
  void recurso.refrescar();
  return { id: data.id as string };
}

// Cancelar: el cliente mientras nadie va en camino; el mensajero libera el
// pedido y la base le devuelve la comisión automáticamente.
export async function cancelarPedido(id: string): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase()
    .from("pedidos")
    .update({ estado: "cancelado" })
    .eq("id", id);
  void recurso.refrescar();
  if (!error) return { ok: true };
  return {
    ok: false,
    error: error.message.includes("va en camino")
      ? "Tu mensajero ya va en camino: escríbele por el chat."
      : "No se pudo cancelar. Inténtalo de nuevo.",
  };
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
