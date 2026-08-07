"use server";

import { clienteAdmin, claveAdminValida } from "@/lib/supabase/admin";
import { enviarCorreoMensajero } from "@/features/mensajero/correo";
import { COMISION_PEDIDO, RECARGA_VALOR } from "@/features/pedidos/tarifas";
import type {
  EstadoMensajero,
  PerfilMensajero,
  ResultadoVerificacion,
} from "@/features/mensajero/tipos";

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
  estado: EstadoMensajero;
  saldo: number;
  registrado_en: string;
  perfiles: { nombre: string | null; celular: string | null; correo: string | null } | null;
};

export type FotosMensajero = {
  cedula: string | null;
  selfie: string | null;
  rostro: string | null;
};

export type MensajeroAdmin = PerfilMensajero & {
  id: string;
  saldo: number;
  fotos: FotosMensajero;
  verificacion: ResultadoVerificacion | null;
};

const NOMBRES_FOTOS = ["cedula", "rostro"] as const;

export async function listarMensajeros(
  clave: string
): Promise<MensajeroAdmin[]> {
  if (!claveAdminValida(clave)) return [];
  const admin = clienteAdmin();
  const { data, error } = await admin
    .from("mensajeros")
    .select("*, perfiles(nombre, celular, correo)")
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

      // Resultado de la verificación facial hecha en el dispositivo
      let verificacion: ResultadoVerificacion | null = null;
      const { data: archivoV } = await admin.storage
        .from("documentos")
        .download(`${f.id}/verificacion.json`);
      if (archivoV) {
        try {
          verificacion = JSON.parse(await archivoV.text()) as ResultadoVerificacion;
        } catch {
          verificacion = null;
        }
      }

      return {
        id: f.id,
        nombre: f.perfiles?.nombre ?? "Sin nombre",
        celular: f.perfiles?.celular ?? "",
        correo: f.perfiles?.correo ?? "",
        documento: f.documento,
        municipio: f.municipio,
        vehiculo: f.vehiculo,
        placa: f.placa ?? undefined,
        estado: f.estado,
        saldo: f.saldo,
        fotos,
        verificacion,
        fechaRegistro: new Date(f.registrado_en).toLocaleDateString("es-CO"),
      };
    })
  );
}

// Recarga manual: el mensajero transfiere por Nequi y el equipo le acredita
// el saldo aquí. Cuando entre la pasarela de pagos, esto será automático.
export async function acreditarRecarga(
  clave: string,
  id: string,
  monto: number = RECARGA_VALOR
): Promise<{ ok: boolean }> {
  if (!claveAdminValida(clave)) return { ok: false };
  if (monto < RECARGA_VALOR || monto > 200000) return { ok: false };
  const admin = clienteAdmin();
  const { data: m } = await admin
    .from("mensajeros")
    .select("saldo")
    .eq("id", id)
    .single();
  if (!m) return { ok: false };
  const { error } = await admin
    .from("mensajeros")
    .update({ saldo: m.saldo + monto })
    .eq("id", id);
  if (error) return { ok: false };
  await admin
    .from("movimientos_saldo")
    .insert({ mensajero_id: id, tipo: "recarga", valor: monto });
  return { ok: true };
}

export type NegocioAdmin = {
  id: string;
  nombre: string;
  categoria: string;
  zona: string;
  direccion: string | null;
  documento: string | null;
  celular: string | null;
  correo: string | null;
  estado: "en_revision" | "aprobado" | "rechazado";
  abierto: boolean;
  productos: number;
  registradoEn: string;
};

export async function listarNegocios(clave: string): Promise<NegocioAdmin[]> {
  if (!claveAdminValida(clave)) return [];
  const admin = clienteAdmin();
  const { data, error } = await admin
    .from("comercios")
    .select("*, productos(id)")
    .order("registrado_en", { ascending: false });
  if (error || !data) return [];
  return data.map((c) => ({
    id: c.id as string,
    nombre: c.nombre as string,
    categoria: c.categoria as string,
    zona: c.zona as string,
    direccion: c.direccion as string | null,
    documento: c.documento as string | null,
    celular: c.celular as string | null,
    correo: c.correo as string | null,
    estado: c.estado as NegocioAdmin["estado"],
    abierto: c.abierto as boolean,
    productos: ((c.productos ?? []) as unknown[]).length,
    registradoEn: new Date(c.registrado_en as string).toLocaleDateString("es-CO"),
  }));
}

export async function cambiarEstadoNegocio(
  clave: string,
  id: string,
  estado: NegocioAdmin["estado"]
): Promise<{ ok: boolean }> {
  if (!claveAdminValida(clave)) return { ok: false };
  const { error } = await clienteAdmin()
    .from("comercios")
    .update({ estado, ...(estado === "aprobado" ? { abierto: true } : {}) })
    .eq("id", id);
  return { ok: !error };
}

export type PedidoAdmin = {
  id: string;
  codigo: string;
  comercio: string;
  barrio: string | null;
  total: number;
  estado: string;
  hora: string;
};

// El panel lee los pedidos con la llave del equipo: la sesión del navegador
// es un usuario anónimo y RLS solo le mostraría los suyos.
export async function listarPedidos(clave: string): Promise<PedidoAdmin[]> {
  if (!claveAdminValida(clave)) return [];
  const { data, error } = await clienteAdmin()
    .from("pedidos")
    .select("id, codigo, barrio, total, estado, creado_en, comercio_nombre, comercios(nombre)")
    .order("creado_en", { ascending: false });
  if (error || !data) return [];
  return data.map((p) => ({
    id: p.id as string,
    codigo: p.codigo as string,
    comercio:
      (p.comercios as unknown as { nombre: string } | null)?.nombre ??
      (p.comercio_nombre as string | null) ??
      "Pedido libre",
    barrio: p.barrio as string | null,
    total: p.total as number,
    estado: p.estado as string,
    hora: new Date(p.creado_en as string).toLocaleTimeString("es-CO", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }),
  }));
}

export async function cambiarEstadoMensajero(
  clave: string,
  id: string,
  estado: EstadoMensajero
): Promise<{ ok: boolean; correoEnviado?: boolean }> {
  if (!claveAdminValida(clave)) return { ok: false };
  const admin = clienteAdmin();
  const { error } = await admin.from("mensajeros").update({ estado }).eq("id", id);
  if (error) return { ok: false };

  // Al aprobar: primer domicilio de cortesía (una sola vez por mensajero)
  if (estado === "aprobado") {
    const { data: previos } = await admin
      .from("movimientos_saldo")
      .select("id")
      .eq("mensajero_id", id)
      .eq("tipo", "cortesia");
    if ((previos ?? []).length === 0) {
      const { data: m } = await admin
        .from("mensajeros")
        .select("saldo")
        .eq("id", id)
        .single();
      await admin
        .from("mensajeros")
        .update({ saldo: (m?.saldo ?? 0) + COMISION_PEDIDO })
        .eq("id", id);
      await admin.from("movimientos_saldo").insert({
        mensajero_id: id,
        tipo: "cortesia",
        valor: COMISION_PEDIDO,
      });
    }
  }

  // Notificación por correo: programada pero inactiva hasta que haya dominio
  // (ver features/mensajero/correo.ts). Nunca bloquea la decisión del equipo.
  if (estado === "aprobado" || estado === "rechazado") {
    const { data: perfil } = await admin
      .from("perfiles")
      .select("nombre, correo")
      .eq("id", id)
      .maybeSingle();
    if (perfil?.correo) {
      const r = await enviarCorreoMensajero(
        perfil.correo as string,
        (perfil.nombre as string) ?? "",
        estado
      );
      if (r.enviado) {
        await admin
          .from("mensajeros")
          .update({ correo_enviado_en: new Date().toISOString() })
          .eq("id", id);
      }
      return { ok: true, correoEnviado: r.enviado };
    }
  }
  return { ok: true, correoEnviado: false };
}
