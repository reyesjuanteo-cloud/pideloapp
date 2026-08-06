"use server";

import { clienteAdmin, claveAdminValida } from "@/lib/supabase/admin";
import type { EstadoMensajero, PerfilMensajero } from "@/features/mensajero/tipos";

// Todas las operaciones del equipo verifican la clave del panel en el
// servidor. ⚠️ TEMPORAL: clave fija hasta tener roles reales de Auth.

export async function crearComercio(
  clave: string,
  datos: { nombre: string; categoria: string; zona: string }
): Promise<{ ok: boolean }> {
  if (!claveAdminValida(clave)) return { ok: false };
  const { error } = await clienteAdmin().from("comercios").insert({
    nombre: datos.nombre,
    categoria: datos.categoria,
    zona: datos.zona,
  });
  return { ok: !error };
}

export async function alternarComercio(
  clave: string,
  id: string,
  abierto: boolean
): Promise<{ ok: boolean }> {
  if (!claveAdminValida(clave)) return { ok: false };
  const { error } = await clienteAdmin()
    .from("comercios")
    .update({ abierto })
    .eq("id", id);
  return { ok: !error };
}

export async function eliminarComercio(
  clave: string,
  id: string
): Promise<{ ok: boolean }> {
  if (!claveAdminValida(clave)) return { ok: false };
  const { error } = await clienteAdmin().from("comercios").delete().eq("id", id);
  return { ok: !error };
}

export async function crearProducto(
  clave: string,
  datos: { comercioId: string; nombre: string; precio: number }
): Promise<{ ok: boolean }> {
  if (!claveAdminValida(clave)) return { ok: false };
  const { error } = await clienteAdmin().from("productos").insert({
    comercio_id: datos.comercioId,
    nombre: datos.nombre,
    precio: datos.precio,
  });
  return { ok: !error };
}

export async function eliminarProducto(
  clave: string,
  id: string
): Promise<{ ok: boolean }> {
  if (!claveAdminValida(clave)) return { ok: false };
  const { error } = await clienteAdmin().from("productos").delete().eq("id", id);
  return { ok: !error };
}

type FilaMensajero = {
  id: string;
  documento: string;
  municipio: PerfilMensajero["municipio"];
  vehiculo: PerfilMensajero["vehiculo"];
  placa: string | null;
  licencia: string | null;
  soat_vigente: boolean | null;
  estado: EstadoMensajero;
  saldo: number;
  registrado_en: string;
  perfiles: { nombre: string | null; celular: string | null } | null;
};

export type FotosMensajero = {
  cedula: string | null;
  selfie: string | null;
  licencia: string | null;
  soat: string | null;
};

export type MensajeroAdmin = PerfilMensajero & {
  id: string;
  saldo: number;
  fotos: FotosMensajero;
};

const NOMBRES_FOTOS = ["cedula", "selfie", "licencia", "soat"] as const;

export async function listarMensajeros(
  clave: string
): Promise<MensajeroAdmin[]> {
  if (!claveAdminValida(clave)) return [];
  const admin = clienteAdmin();
  const { data, error } = await admin
    .from("mensajeros")
    .select("*, perfiles(nombre, celular)")
    .order("registrado_en", { ascending: false });
  if (error || !data) return [];

  return Promise.all(
    (data as FilaMensajero[]).map(async (f) => {
      // URLs firmadas (1 hora) para revisar los documentos del aspirante.
      const rutas = NOMBRES_FOTOS.map((n) => `${f.id}/${n}.jpg`);
      const { data: firmas } = await admin.storage
        .from("documentos")
        .createSignedUrls(rutas, 3600);
      const fotos = Object.fromEntries(
        NOMBRES_FOTOS.map((n, i) => [n, firmas?.[i]?.signedUrl ?? null])
      ) as FotosMensajero;

      return {
        id: f.id,
        nombre: f.perfiles?.nombre ?? "Sin nombre",
        celular: f.perfiles?.celular ?? "",
        documento: f.documento,
        municipio: f.municipio,
        vehiculo: f.vehiculo,
        placa: f.placa ?? undefined,
        licencia: f.licencia ?? undefined,
        soatVigente: f.soat_vigente ?? undefined,
        estado: f.estado,
        saldo: f.saldo,
        fotos,
        fechaRegistro: new Date(f.registrado_en).toLocaleDateString("es-CO"),
      };
    })
  );
}

export async function cambiarEstadoMensajero(
  clave: string,
  id: string,
  estado: EstadoMensajero
): Promise<{ ok: boolean }> {
  if (!claveAdminValida(clave)) return { ok: false };
  const { error } = await clienteAdmin()
    .from("mensajeros")
    .update({ estado })
    .eq("id", id);
  return { ok: !error };
}
