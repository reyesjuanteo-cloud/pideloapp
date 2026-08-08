import { NextResponse } from "next/server";
import webpush from "web-push";
import { clienteAdmin } from "@/lib/supabase/admin";

// Punto de envío de notificaciones. Lo llama la base de datos (pg_net) con
// una firma secreta cuando pasa algo que alguien debe saber con la app
// cerrada. Nadie más puede disparar avisos.

const currency = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

type Suscripcion = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

async function enviarA(
  suscripciones: Suscripcion[],
  titulo: string,
  cuerpo: string,
  url: string
): Promise<number> {
  webpush.setVapidDetails(
    "mailto:info@scalexpertsdigital.com",
    process.env.NEXT_PUBLIC_VAPID_PUBLICA!,
    process.env.VAPID_PRIVADA!
  );
  const admin = clienteAdmin();
  let enviadas = 0;
  await Promise.all(
    suscripciones.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          JSON.stringify({ titulo, cuerpo, url })
        );
        enviadas += 1;
      } catch (e) {
        // Suscripción vencida (el navegador la rotó o la revocaron): se limpia
        const codigo = (e as { statusCode?: number }).statusCode;
        if (codigo === 404 || codigo === 410) {
          await admin.from("suscripciones_push").delete().eq("endpoint", s.endpoint);
        }
      }
    })
  );
  return enviadas;
}

export async function POST(peticion: Request) {
  if (peticion.headers.get("x-pidelo-firma") !== process.env.PUSH_SECRETO) {
    return NextResponse.json({ error: "sin_permiso" }, { status: 401 });
  }
  if (!process.env.VAPID_PRIVADA) {
    return NextResponse.json({ error: "sin_llaves" }, { status: 500 });
  }

  const evento = (await peticion.json()) as {
    tipo: "solicitud" | "oferta";
    solicitud_id: string;
    categoria_id?: string;
    oferta_id?: string;
  };
  const admin = clienteAdmin();

  const { data: solicitud } = await admin
    .from("solicitudes_servicio")
    .select("id, cliente_id, descripcion, barrio, ciudad, oferta_cliente, categorias_servicio(nombre)")
    .eq("id", evento.solicitud_id)
    .maybeSingle();
  if (!solicitud) return NextResponse.json({ enviadas: 0 });
  const categoria =
    (solicitud.categorias_servicio as unknown as { nombre: string } | null)?.nombre ??
    "Servicio";

  if (evento.tipo === "solicitud") {
    // A los trabajadores aprobados y DISPONIBLES de esa categoría
    const { data: trabajadores } = await admin
      .from("proveedor_categorias")
      .select("proveedor_id, proveedores!inner(estado, disponible)")
      .eq("categoria_id", evento.categoria_id!)
      .eq("proveedores.estado", "aprobado")
      .eq("proveedores.disponible", true);
    const ids = (trabajadores ?? [])
      .map((t) => t.proveedor_id as string)
      .filter((id) => id !== solicitud.cliente_id);
    if (ids.length === 0) return NextResponse.json({ enviadas: 0 });

    const { data: subs } = await admin
      .from("suscripciones_push")
      .select("endpoint, p256dh, auth")
      .in("usuario_id", ids);
    const enviadas = await enviarA(
      (subs ?? []) as Suscripcion[],
      `⚡ ${categoria} en ${solicitud.barrio || solicitud.ciudad}`,
      solicitud.oferta_cliente
        ? `Ofrecen ${currency.format(solicitud.oferta_cliente)}: ${solicitud.descripcion.slice(0, 90)}`
        : solicitud.descripcion.slice(0, 110),
      "/proveedor/panel"
    );
    return NextResponse.json({ enviadas });
  }

  // Nueva oferta → al cliente de la solicitud
  const { data: oferta } = await admin
    .from("ofertas_servicio")
    .select("precio, llegada_min")
    .eq("id", evento.oferta_id!)
    .maybeSingle();
  if (!oferta || !solicitud.cliente_id) return NextResponse.json({ enviadas: 0 });

  const { data: subs } = await admin
    .from("suscripciones_push")
    .select("endpoint, p256dh, auth")
    .eq("usuario_id", solicitud.cliente_id);
  const enviadas = await enviarA(
    (subs ?? []) as Suscripcion[],
    `💰 Nueva oferta: ${currency.format(oferta.precio as number)}`,
    `${categoria} · llega en ${oferta.llegada_min ?? "?"} min. Compara y elige.`,
    `/servicios/${solicitud.id}`
  );
  return NextResponse.json({ enviadas });
}
