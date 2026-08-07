"use client";

// Datos del marketplace de servicios. La seguridad vive en la base (RLS y
// triggers verificados): aquí solo se lee y escribe lo permitido.
import { supabase } from "@/lib/supabase/cliente";
import { crearRecursoRemoto } from "@/lib/recurso-remoto";
import { distanciaKm } from "@/components/ui/mapa-base";

export type CategoriaServicio = { id: string; nombre: string };

export type EstadoServicio =
  | "publicada"
  | "contratada"
  | "en_camino"
  | "llegue"
  | "en_progreso"
  | "terminada_proveedor"
  | "completada"
  | "disputada"
  | "cancelada";

export type Solicitud = {
  id: string;
  codigo: string;
  categoria: string;
  descripcion: string;
  ofertaCliente: number | null;
  barrio: string;
  ciudad: string;
  latAprox: number | null;
  lngAprox: number | null;
  estado: EstadoServicio;
  proveedorId: string | null;
  proveedorNombre?: string;
  precioFinal: number | null;
  motivoCancelacion: string | null;
  creadoEn: string;
  esMia: boolean;
};

export type Oferta = {
  id: string;
  solicitudId: string;
  proveedorId: string;
  proveedorNombre: string;
  serviciosCompletados: number;
  precio: number;
  llegadaMin: number | null;
  mensaje: string | null;
  estado: "activa" | "aceptada" | "descartada" | "retirada";
};

export type MiProveedor = {
  id: string;
  estado: "en_revision" | "aprobado" | "rechazado" | "suspendido";
  disponible: boolean;
  municipio: string;
  serviciosCompletados: number;
  categorias: string[]; // ids
  lat: number | null;
  lng: number | null;
  radioKm: number;
};

// ---------------------------------------------------------------- categorías
const recursoCategorias = crearRecursoRemoto<CategoriaServicio[]>([], async () => {
  const { data } = await supabase()
    .from("categorias_servicio")
    .select("id, nombre")
    .eq("activa", true)
    .order("orden");
  return (data ?? []) as CategoriaServicio[];
});
export const useCategoriasServicio = recursoCategorias.useRecurso;

// ------------------------------------------------------------- mi proveedor
const recursoMiProveedor = crearRecursoRemoto<MiProveedor | null>(null, async () => {
  const sb = supabase();
  const {
    data: { session },
  } = await sb.auth.getSession();
  if (!session) return null;
  const { data } = await sb
    .from("proveedores")
    .select("id, estado, disponible, municipio, servicios_completados, lat, lng, radio_km, proveedor_categorias(categoria_id)")
    .eq("id", session.user.id)
    .maybeSingle();
  if (!data) return null;
  return {
    id: data.id as string,
    estado: data.estado as MiProveedor["estado"],
    disponible: data.disponible as boolean,
    municipio: data.municipio as string,
    serviciosCompletados: data.servicios_completados as number,
    lat: data.lat as number | null,
    lng: data.lng as number | null,
    radioKm: data.radio_km as number,
    categorias: ((data.proveedor_categorias ?? []) as { categoria_id: string }[]).map(
      (c) => c.categoria_id
    ),
  };
});
export const useEstadoMiProveedor = recursoMiProveedor.useEstado;
export const refrescarMiProveedor = recursoMiProveedor.refrescar;

type FilaSolicitud = {
  id: string;
  codigo: string;
  descripcion: string;
  oferta_cliente: number | null;
  barrio: string | null;
  ciudad: string;
  lat_aprox: number | null;
  lng_aprox: number | null;
  estado: EstadoServicio;
  proveedor_id: string | null;
  cliente_id: string | null;
  precio_final: number | null;
  motivo_cancelacion: string | null;
  creado_en: string;
  categorias_servicio: { nombre: string } | null;
};

function aSolicitud(fila: FilaSolicitud, uid: string | undefined): Solicitud {
  return {
    id: fila.id,
    codigo: fila.codigo,
    categoria: fila.categorias_servicio?.nombre ?? "Servicio",
    descripcion: fila.descripcion,
    ofertaCliente: fila.oferta_cliente,
    barrio: fila.barrio ?? "",
    ciudad: fila.ciudad,
    latAprox: fila.lat_aprox,
    lngAprox: fila.lng_aprox,
    estado: fila.estado,
    proveedorId: fila.proveedor_id,
    precioFinal: fila.precio_final,
    motivoCancelacion: fila.motivo_cancelacion,
    creadoEn: fila.creado_en,
    esMia: fila.cliente_id === uid,
  };
}

// Las solicitudes que me conciernen (como cliente o como proveedor) y, si soy
// proveedor aprobado, las publicadas de mis categorías. RLS filtra por mí.
const recursoSolicitudes = crearRecursoRemoto<Solicitud[]>([], async () => {
  const sb = supabase();
  const {
    data: { session },
  } = await sb.auth.getSession();
  if (!session) return [];
  const { data } = await sb
    .from("solicitudes_servicio")
    .select(
      "id, codigo, descripcion, oferta_cliente, barrio, ciudad, lat_aprox, lng_aprox, estado, proveedor_id, cliente_id, precio_final, motivo_cancelacion, creado_en, categorias_servicio(nombre)"
    )
    .order("creado_en", { ascending: false })
    .limit(60);
  return ((data ?? []) as unknown as FilaSolicitud[]).map((f) =>
    aSolicitud(f, session.user.id)
  );
});
export const useSolicitudes = recursoSolicitudes.useRecurso;
export const useEstadoSolicitudes = recursoSolicitudes.useEstado;
export const refrescarSolicitudes = recursoSolicitudes.refrescar;

let canalSolicitudes: ReturnType<ReturnType<typeof supabase>["channel"]> | null = null;
let escuchasGlobales = false;

async function conectarCanalServicios(): Promise<void> {
  const sb = supabase();
  const {
    data: { session },
  } = await sb.auth.getSession();
  if (!session) return;
  sb.realtime.setAuth(session.access_token);
  if (canalSolicitudes) {
    await sb.removeChannel(canalSolicitudes);
    canalSolicitudes = null;
  }
  canalSolicitudes = sb
    .channel("servicios")
    .on("postgres_changes", { event: "*", schema: "public", table: "solicitudes_servicio" }, () => {
      void recursoSolicitudes.refrescar();
    })
    .on("postgres_changes", { event: "*", schema: "public", table: "ofertas_servicio" }, () => {
      void recursoSolicitudes.refrescar();
    })
    .subscribe((estado) => {
      if (estado === "SUBSCRIBED") void recursoSolicitudes.refrescar();
    });
}

export async function iniciarRealtimeServicios(): Promise<void> {
  if (!canalSolicitudes) await conectarCanalServicios();
  if (escuchasGlobales || typeof window === "undefined") return;
  escuchasGlobales = true;

  // Al volver la red o traer la app al frente: reconectar y re-sincronizar,
  // porque el canal puede haberse quedado frío con el celular suspendido.
  const revivir = () => {
    void recursoSolicitudes.refrescar();
    void recursoMiProveedor.refrescar();
    if (canalSolicitudes?.state !== "joined") void conectarCanalServicios();
  };
  window.addEventListener("online", revivir);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") revivir();
  });
}

// ------------------------------------------------------------------ acciones
export async function publicarSolicitud(datos: {
  categoriaId: string;
  descripcion: string;
  ofertaCliente: number | null;
  direccion: string;
  indicaciones?: string;
  barrio: string;
  ciudad: string;
  lat: number;
  lng: number;
}): Promise<{ id?: string; error?: string }> {
  const sb = supabase();
  const {
    data: { session },
  } = await sb.auth.getSession();
  if (!session) return { error: "Inicia sesión para pedir un servicio." };

  const { data, error } = await sb
    .from("solicitudes_servicio")
    .insert({
      cliente_id: session.user.id,
      categoria_id: datos.categoriaId,
      descripcion: datos.descripcion,
      oferta_cliente: datos.ofertaCliente,
      barrio: datos.barrio,
      ciudad: datos.ciudad,
      lat_aprox: datos.lat,
      lng_aprox: datos.lng,
    })
    .select("id")
    .single();
  if (error || !data) {
    return {
      error: error?.message.includes("contacto_personal")
        ? "Por tu seguridad, no incluyas teléfonos ni redes en la descripción. El proveedor te contactará por el chat de Pídelo."
        : "No se pudo publicar tu solicitud.",
    };
  }
  // La dirección exacta va aparte: solo la ve el proveedor contratado
  await sb.from("direcciones_solicitud").insert({
    solicitud_id: data.id,
    direccion: datos.direccion,
    indicaciones: datos.indicaciones ?? null,
    lat: datos.lat,
    lng: datos.lng,
  });
  void recursoSolicitudes.refrescar();
  return { id: data.id as string };
}

export async function ofertar(datos: {
  solicitudId: string;
  precio: number;
  llegadaMin: number;
  mensaje: string;
}): Promise<{ ok: boolean; error?: string }> {
  const sb = supabase();
  const {
    data: { session },
  } = await sb.auth.getSession();
  if (!session) return { ok: false, error: "Sin sesión." };
  const { error } = await sb.from("ofertas_servicio").insert({
    solicitud_id: datos.solicitudId,
    proveedor_id: session.user.id,
    precio: datos.precio,
    llegada_min: datos.llegadaMin,
    mensaje: datos.mensaje.trim() || null,
  });
  if (error) {
    if (error.message.includes("duplicate")) {
      return { ok: false, error: "Ya ofertaste en esta solicitud." };
    }
    return { ok: false, error: "No se pudo enviar tu oferta." };
  }
  return { ok: true };
}

export async function contratar(
  solicitudId: string,
  proveedorId: string
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase()
    .from("solicitudes_servicio")
    .update({ estado: "contratada", proveedor_id: proveedorId })
    .eq("id", solicitudId);
  void recursoSolicitudes.refrescar();
  return error ? { ok: false, error: "No se pudo contratar. Intenta de nuevo." } : { ok: true };
}

export async function cambiarEstadoServicio(
  solicitudId: string,
  estado: EstadoServicio,
  motivo?: string
): Promise<{ ok: boolean }> {
  const { error } = await supabase()
    .from("solicitudes_servicio")
    .update({
      estado,
      ...(motivo ? { motivo_cancelacion: motivo } : {}),
    })
    .eq("id", solicitudId);
  void recursoSolicitudes.refrescar();
  return { ok: !error };
}

export function distanciaASolicitud(
  solicitud: Solicitud,
  lat: number | null,
  lng: number | null
): number | null {
  if (
    lat === null ||
    lng === null ||
    solicitud.latAprox === null ||
    solicitud.lngAprox === null
  ) {
    return null;
  }
  return distanciaKm([lng, lat], [solicitud.lngAprox, solicitud.latAprox]);
}
