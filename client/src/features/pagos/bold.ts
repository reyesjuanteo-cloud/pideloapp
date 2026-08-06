"use server";

// Recargas con Bold (pasarela colombiana: Nequi, PSE, tarjetas).
//
// Flujo: el mensajero pide recargar → aquí se registra la recarga y se crea
// un enlace de pago de Bold → paga en el checkout de Bold → Bold avisa a
// /api/pagos/bold y ahí se le acredita el saldo.
import { createClient } from "@/lib/supabase/server";
import { clienteAdmin } from "@/lib/supabase/admin";
import { RECARGA_VALOR } from "@/features/pedidos/tarifas";

const BOLD_ENLACES = "https://integrations.api.bold.co/online/link/v1";

export type ResultadoRecarga = {
  ok: boolean;
  url?: string;
  error?: string;
};

export async function crearRecargaBold(
  monto: number = RECARGA_VALOR
): Promise<ResultadoRecarga> {
  if (monto < RECARGA_VALOR || monto > 200000) {
    return { ok: false, error: "Monto fuera de rango." };
  }
  const llave = process.env.BOLD_LLAVE_IDENTIDAD;
  if (!llave) return { ok: false, error: "Pagos en línea no configurados." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Inicia sesión para recargar." };

  const admin = clienteAdmin();
  const { data: mensajero } = await admin
    .from("mensajeros")
    .select("estado")
    .eq("id", user.id)
    .maybeSingle();
  if (mensajero?.estado !== "aprobado") {
    return { ok: false, error: "Tu registro aún no está aprobado." };
  }

  const { data: recarga, error } = await admin
    .from("recargas")
    .insert({ mensajero_id: user.id, monto, medio: "bold" })
    .select("id")
    .single();
  if (error || !recarga) return { ok: false, error: "No se pudo iniciar la recarga." };

  const sitio = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pideloapp.vercel.app";
  try {
    const r = await fetch(BOLD_ENLACES, {
      method: "POST",
      headers: {
        Authorization: `x-api-key ${llave}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount_type: "CLOSE",
        amount: { currency: "COP", total_amount: monto, tip_amount: 0 },
        description: `Recarga de saldo Pídelo · ${recarga.id}`,
        // Bold devuelve al mensajero a su panel al terminar
        callback_url: `${sitio}/driver/dashboard`,
        payer_email: undefined,
      }),
    });
    const datos = await r.json();
    const url: string | undefined = datos?.payload?.url;
    const referencia: string | undefined = datos?.payload?.payment_link;
    if (!r.ok || !url) {
      await admin.from("recargas").update({ estado: "fallida" }).eq("id", recarga.id);
      return { ok: false, error: "La pasarela no respondió. Intenta de nuevo." };
    }
    await admin.from("recargas").update({ referencia }).eq("id", recarga.id);
    return { ok: true, url };
  } catch {
    await admin.from("recargas").update({ estado: "fallida" }).eq("id", recarga.id);
    return { ok: false, error: "No pudimos conectar con la pasarela." };
  }
}

// Acredita una recarga pagada. La llama el webhook de Bold y es idempotente:
// si Bold reintenta el aviso, el saldo no se suma dos veces.
export async function acreditarRecargaPagada(
  referencia: string
): Promise<{ ok: boolean }> {
  const admin = clienteAdmin();
  const { data: recarga } = await admin
    .from("recargas")
    .select("id, mensajero_id, monto, estado")
    .eq("referencia", referencia)
    .maybeSingle();
  if (!recarga || recarga.estado === "pagada") return { ok: Boolean(recarga) };

  const { data: mensajero } = await admin
    .from("mensajeros")
    .select("saldo")
    .eq("id", recarga.mensajero_id)
    .single();
  if (!mensajero) return { ok: false };

  await admin
    .from("mensajeros")
    .update({ saldo: mensajero.saldo + recarga.monto })
    .eq("id", recarga.mensajero_id);
  await admin.from("movimientos_saldo").insert({
    mensajero_id: recarga.mensajero_id,
    tipo: "recarga",
    valor: recarga.monto,
  });
  await admin
    .from("recargas")
    .update({ estado: "pagada", pagado_en: new Date().toISOString() })
    .eq("id", recarga.id);
  return { ok: true };
}
