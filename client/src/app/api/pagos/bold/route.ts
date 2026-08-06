import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { acreditarRecargaPagada } from "@/features/pagos/bold";

// Aviso de Bold cuando un pago entra. Se verifica la firma con la llave
// secreta: sin eso, cualquiera podría avisar pagos falsos y regalarse saldo.
function firmaValida(cuerpo: string, firma: string | null): boolean {
  const secreta = process.env.BOLD_LLAVE_SECRETA;
  if (!secreta || !firma) return false;
  const esperada = createHmac("sha256", secreta).update(cuerpo).digest("hex");
  const a = Buffer.from(esperada);
  const b = Buffer.from(firma.trim().toLowerCase());
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(peticion: Request) {
  const cuerpo = await peticion.text();
  const firma =
    peticion.headers.get("x-bold-signature") ??
    peticion.headers.get("bold-signature");

  if (!firmaValida(cuerpo, firma)) {
    return NextResponse.json({ error: "firma_invalida" }, { status: 401 });
  }

  try {
    const evento = JSON.parse(cuerpo);
    const tipo: string = evento.type ?? evento.event ?? "";
    // Bold identifica el pago con el enlace que creamos (payment_link).
    const referencia: string | undefined =
      evento.data?.payment_link ??
      evento.data?.metadata?.reference ??
      evento.payment_link;

    if (tipo.toUpperCase().includes("APPROVED") && referencia) {
      await acreditarRecargaPagada(referencia);
    }
    return NextResponse.json({ recibido: true });
  } catch {
    return NextResponse.json({ error: "cuerpo_invalido" }, { status: 400 });
  }
}
