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

// Le pregunta a Bold si una recarga ya se pagó. No dependemos del webhook:
// si no llega (no registrado, red caída, formato distinto), el saldo se
// acredita igual cuando el mensajero vuelve a su panel.
async function estaPagadaEnBold(referencia: string): Promise<boolean> {
  const llave = process.env.BOLD_LLAVE_IDENTIDAD;
  if (!llave) return false;
  try {
    const r = await fetch(`${BOLD_ENLACES}/${referencia}`, {
      headers: { Authorization: `x-api-key ${llave}` },
      cache: "no-store",
    });
    if (!r.ok) return false;
    const datos = await r.json();
    return String(datos?.status ?? "").toUpperCase() === "PAID";
  } catch {
    return false;
  }
}

// Revisa las recargas pendientes del mensajero y acredita las que la pasarela
// da por pagadas. Se llama al abrir el panel y al volver del checkout.
export async function conciliarRecargas(): Promise<{ acreditadas: number }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { acreditadas: 0 };

  const admin = clienteAdmin();
  const { data: pendientes } = await admin
    .from("recargas")
    .select("id, referencia")
    .eq("mensajero_id", user.id)
    .eq("estado", "pendiente")
    .not("referencia", "is", null);

  let acreditadas = 0;
  for (const recarga of pendientes ?? []) {
    if (await estaPagadaEnBold(recarga.referencia as string)) {
      const r = await acreditarRecargaPagada(recarga.referencia as string);
      if (r.ok) acreditadas += 1;
    }
  }
  return { acreditadas };
}

// Acredita una recarga pagada. La llaman el webhook y la conciliación; es
// idempotente: si el aviso se repite, el saldo no se suma dos veces.
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
