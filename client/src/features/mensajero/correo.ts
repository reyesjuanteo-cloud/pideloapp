"use server";

// Correos al mensajero (aprobación / rechazo).
//
// ⏸️ INACTIVO A PROPÓSITO hasta tener dominio propio. Todo el envío está
// programado: en cuanto existan las variables de entorno RESEND_API_KEY y
// CORREO_REMITENTE, empieza a enviar solo, sin tocar más código.
//
// Para activarlo (cuando haya dominio):
//   1. Crear cuenta en resend.com y verificar el dominio (ej. pidelo.app).
//   2. En Vercel → Settings → Environment Variables agregar:
//        RESEND_API_KEY   = re_xxxxxxxx
//        CORREO_REMITENTE = Pídelo <hola@tudominio.com>
//   3. Redesplegar. Nada más.

export type ResultadoCorreo = {
  enviado: boolean;
  motivo?: "sin_configurar" | "fallo";
};

function estaConfigurado(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.CORREO_REMITENTE);
}

const ENVOLTURA = (contenido: string) => `
<div style="font-family:system-ui,-apple-system,sans-serif;background:#faf8f6;padding:24px">
  <div style="max-width:520px;margin:0 auto;background:#fff;border:1px solid #e6dcd2;border-radius:14px;padding:24px">
    <p style="margin:0 0 16px;font-size:22px;font-weight:700;color:#e8380d">PideloApp</p>
    ${contenido}
    <p style="margin:24px 0 0;font-size:12px;color:#75655c">
      Pídelo · Domicilios en Girardot, Ricaurte y Flandes
    </p>
  </div>
</div>`;

const plantillas = {
  aprobado: (nombre: string) => ({
    asunto: "Tu registro fue aprobado — ya puedes trabajar con Pídelo",
    html: ENVOLTURA(`
      <p style="font-size:16px;color:#241a14">Hola ${nombre},</p>
      <p style="font-size:14px;line-height:1.6;color:#241a14">
        Revisamos tus datos y <strong>tu registro quedó aprobado</strong>. Ya puedes
        entrar a tu panel, activar tu disponibilidad y empezar a recibir pedidos.
      </p>
      <p style="font-size:14px;line-height:1.6;color:#241a14">
        Recuerda que cada pedido que aceptes descuenta $1.000 de tu saldo, y que
        cada recarga de $5.000 te alcanza para 5 pedidos.
      </p>
      <p style="margin:24px 0">
        <a href="https://pideloapp.vercel.app/driver/dashboard"
           style="display:inline-block;background:#e8380d;color:#fff;text-decoration:none;
                  padding:12px 20px;border-radius:12px;font-weight:600;font-size:14px">
          Ir a mi panel
        </a>
      </p>`),
  }),
  rechazado: (nombre: string) => ({
    asunto: "Sobre tu registro en Pídelo",
    html: ENVOLTURA(`
      <p style="font-size:16px;color:#241a14">Hola ${nombre},</p>
      <p style="font-size:14px;line-height:1.6;color:#241a14">
        Revisamos tu registro y por ahora <strong>no pudimos aprobarlo</strong>.
        Suele pasar cuando la foto del documento no se lee bien o los datos no
        coinciden. Puedes corregirlos y volver a enviarlo cuando quieras.
      </p>
      <p style="margin:24px 0">
        <a href="https://pideloapp.vercel.app/mensajero/registro"
           style="display:inline-block;background:#e8380d;color:#fff;text-decoration:none;
                  padding:12px 20px;border-radius:12px;font-weight:600;font-size:14px">
          Corregir mis datos
        </a>
      </p>`),
  }),
};

export async function enviarCorreoMensajero(
  destino: string,
  nombre: string,
  tipo: "aprobado" | "rechazado"
): Promise<ResultadoCorreo> {
  if (!estaConfigurado() || !destino) {
    return { enviado: false, motivo: "sin_configurar" };
  }
  const { asunto, html } = plantillas[tipo](nombre.split(/\s+/)[0]);
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.CORREO_REMITENTE,
        to: destino,
        subject: asunto,
        html,
      }),
    });
    return r.ok ? { enviado: true } : { enviado: false, motivo: "fallo" };
  } catch {
    return { enviado: false, motivo: "fallo" };
  }
}
