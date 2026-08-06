"use server";

import { createClient } from "@/lib/supabase/server";
import { clienteAdmin } from "@/lib/supabase/admin";
import { COMISION_PEDIDO, RECARGA_VALOR } from "./tarifas";

async function usuarioActual(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

// El mensajero acepta un pedido: verifica saldo, lo asigna y descuenta la
// comisión — todo del lado del servidor para que no se pueda saltar.
export async function aceptarPedido(
  pedidoId: string
): Promise<{ ok: boolean; error?: string }> {
  const uid = await usuarioActual();
  if (!uid) return { ok: false, error: "Sin sesión." };

  const admin = clienteAdmin();

  const { data: mensajero } = await admin
    .from("mensajeros")
    .select("saldo, estado")
    .eq("id", uid)
    .single();
  if (!mensajero || mensajero.estado !== "aprobado") {
    return { ok: false, error: "Tu registro no está aprobado." };
  }
  if (mensajero.saldo < COMISION_PEDIDO) {
    return { ok: false, error: "Saldo insuficiente. Recarga para continuar." };
  }

  // Asignar solo si sigue disponible (evita que dos mensajeros lo tomen).
  const { data: actualizado, error } = await admin
    .from("pedidos")
    .update({ estado: "preparando", mensajero_id: uid })
    .eq("id", pedidoId)
    .eq("estado", "buscando")
    .select("id");
  if (error || !actualizado || actualizado.length === 0) {
    return { ok: false, error: "Otro mensajero tomó este pedido." };
  }

  await admin
    .from("mensajeros")
    .update({ saldo: mensajero.saldo - COMISION_PEDIDO })
    .eq("id", uid);
  await admin.from("movimientos_saldo").insert({
    mensajero_id: uid,
    tipo: "comision",
    valor: -COMISION_PEDIDO,
    pedido_id: pedidoId,
  });

  return { ok: true };
}

// ⚠️ TEMPORAL: recarga simulada — irá a una pasarela de pagos real.
export async function recargarSaldo(): Promise<{ ok: boolean }> {
  const uid = await usuarioActual();
  if (!uid) return { ok: false };

  const admin = clienteAdmin();
  const { data: mensajero } = await admin
    .from("mensajeros")
    .select("saldo")
    .eq("id", uid)
    .single();
  if (!mensajero) return { ok: false };

  await admin
    .from("mensajeros")
    .update({ saldo: mensajero.saldo + RECARGA_VALOR })
    .eq("id", uid);
  await admin.from("movimientos_saldo").insert({
    mensajero_id: uid,
    tipo: "recarga",
    valor: RECARGA_VALOR,
  });
  return { ok: true };
}
