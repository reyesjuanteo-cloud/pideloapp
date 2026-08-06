import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { acreditarRecargaPagada } from "@/features/pagos/bold";
import { clienteAdmin } from "@/lib/supabase/admin";

// Aviso de Bold cuando un pago entra. Se verifica la firma con la llave
// secreta: sin eso, cualquiera podría avisar pagos falsos y regalarse saldo.
function firmaValida(cuerpo: string, firma: string | null): boolean {
  const secreta = process.env.BOLD_LLAVE_SECRETA;
  if (!secreta || !firma) return false;
  const recibida = firma.trim();
  // Bold puede firmar en hexadecimal o en base64 según la integración.
  return ["hex", "base64"].some((formato) => {
    const esperada = createHmac("sha256", secreta)
      .update(cuerpo)
      .digest(formato as "hex" | "base64");
    const a = Buffer.from(esperada);
    const b = Buffer.from(formato === "hex" ? recibida.toLowerCase() : recibida);
    return a.length === b.length && timingSafeEqual(a, b);
  });
}

export async function POST(peticion: Request) {
  const cuerpo = await peticion.text();
  const firma =
    peticion.headers.get("x-bold-signature") ??
    peticion.headers.get("bold-signature");
  const valida = firmaValida(cuerpo, firma);

  // Todo aviso queda registrado, válido o no: si Bold cambia el formato, el
  // equipo puede ver exactamente qué llegó en vez de adivinar.
  let evento: Record<string, unknown> = {};
  try {
    evento = JSON.parse(cuerpo);
  } catch {
    evento = { crudo: cuerpo.slice(0, 2000) };
  }
  await clienteAdmin()
    .from("eventos_pago")
    .insert({ origen: "bold", firma_valida: valida, cuerpo: evento });

  if (!valida) {
    return NextResponse.json({ error: "firma_invalida" }, { status: 401 });
  }

  // Buscar el identificador del enlace en las formas conocidas del aviso.
  const datos = (evento.data ?? {}) as Record<string, unknown>;
  const tipo = String(evento.type ?? evento.event ?? "");
  const referencia =
    (datos.payment_link as string) ??
    (datos.reference as string) ??
    ((datos.metadata as Record<string, string>)?.reference as string) ??
    (evento.payment_link as string);

  if (referencia && /APPROVED|PAID|SALE/i.test(tipo)) {
    await acreditarRecargaPagada(referencia);
  }
  return NextResponse.json({ recibido: true });
}
