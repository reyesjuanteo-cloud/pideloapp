"use server";

// Eliminación de cuenta y datos, conforme a la Política de eliminación de
// cuenta (/legal/eliminar-cuenta) y al derecho de supresión de la Ley 1581.
//
// Se borra todo lo que identifica a la persona; los pedidos quedan
// anonimizados porque la ley obliga a conservar el soporte contable 5 años.
import { createClient } from "@/lib/supabase/server";
import { clienteAdmin } from "@/lib/supabase/admin";

export type ResultadoEliminacion = {
  ok: boolean;
  error?: string;
};

export async function eliminarMiCuenta(): Promise<ResultadoEliminacion> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No hay sesión activa." };

  const admin = clienteAdmin();
  const uid = user.id;

  // 1. No se puede borrar con un pedido o servicio en curso: quedaría la
  //    contraparte a mitad de un trabajo.
  const { data: enCurso } = await admin
    .from("pedidos")
    .select("id")
    .or(`cliente_id.eq.${uid},mensajero_id.eq.${uid}`)
    .in("estado", ["buscando", "preparando", "en_camino", "llegue"]);
  const { data: serviciosEnCurso } = await admin
    .from("solicitudes_servicio")
    .select("id")
    .or(`cliente_id.eq.${uid},proveedor_id.eq.${uid}`)
    .in("estado", ["contratada", "en_camino", "llegue", "en_progreso", "terminada_proveedor"]);
  if ((enCurso ?? []).length > 0 || (serviciosEnCurso ?? []).length > 0) {
    return {
      ok: false,
      error:
        "Tienes un pedido en curso. Espera a que termine o cancélalo antes de eliminar tu cuenta.",
    };
  }

  // 2. Documentos del mensajero (cédula, rostro, verificación)
  const { data: archivos } = await admin.storage.from("documentos").list(uid);
  if (archivos?.length) {
    await admin.storage
      .from("documentos")
      .remove(archivos.map((a) => `${uid}/${a.name}`));
  }

  // 3. Anonimizar el historial en vez de borrarlo (obligación contable)
  await admin
    .from("pedidos")
    .update({
      direccion: "Dirección eliminada",
      barrio: null,
      indicaciones: null,
      lat: null,
      lng: null,
    })
    .eq("cliente_id", uid);

  // 4. Datos personales y de trabajo
  await admin.from("mensajes").delete().eq("autor_id", uid);
  await admin.from("mensajes_servicio").delete().eq("autor_id", uid);
  await admin
    .from("solicitudes_servicio")
    .update({ estado: "cancelada" })
    .eq("cliente_id", uid)
    .eq("estado", "publicada");
  await admin.from("proveedores").delete().eq("id", uid);
  await admin.from("posiciones_mensajero").delete().eq("mensajero_id", uid);
  await admin.from("direcciones").delete().eq("usuario_id", uid);
  await admin.from("comercios").update({ dueno_id: null }).eq("dueno_id", uid);

  // 5. La cuenta de acceso. El perfil y el registro de mensajero se van en
  //    cascada; los pedidos conservan su referencia ya anonimizada.
  await admin.from("mensajeros").delete().eq("id", uid);
  await admin.from("perfiles").delete().eq("id", uid);
  const { error } = await admin.auth.admin.deleteUser(uid);
  if (error) {
    return { ok: false, error: "No pudimos eliminar la cuenta. Escríbenos." };
  }

  return { ok: true };
}
