"use client";

// Mensajes entre el cliente y el mensajero de un pedido. Llegan en vivo por
// Realtime; RLS garantiza que solo esas dos personas los ven.
import { useEffect, useState } from "react";
import { asegurarSesion, supabase } from "@/lib/supabase/cliente";

export type Mensaje = {
  id: string;
  autorId: string;
  texto: string;
  hora: string;
};

type FilaMensaje = {
  id: string;
  autor_id: string;
  texto: string;
  creado_en: string;
};

function aMensaje(f: FilaMensaje): Mensaje {
  return {
    id: f.id,
    autorId: f.autor_id,
    texto: f.texto,
    hora: new Date(f.creado_en).toLocaleTimeString("es-CO", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }),
  };
}

export function useMensajes(pedidoId: string) {
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [yo, setYo] = useState<string | null>(null);
  const [cargado, setCargado] = useState(false);

  useEffect(() => {
    let vigente = true;
    const sb = supabase();

    async function cargar() {
      const {
        data: { session },
      } = await sb.auth.getSession();
      if (vigente) setYo(session?.user.id ?? null);

      const { data } = await sb
        .from("mensajes")
        .select("id, autor_id, texto, creado_en")
        .eq("pedido_id", pedidoId)
        .order("creado_en");
      if (vigente) {
        setMensajes(((data ?? []) as FilaMensaje[]).map(aMensaje));
        setCargado(true);
      }
    }
    void cargar();

    const canal = sb
      .channel(`mensajes-${pedidoId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "mensajes",
          filter: `pedido_id=eq.${pedidoId}`,
        },
        (evento) => {
          const nuevo = aMensaje(evento.new as FilaMensaje);
          setMensajes((previos) =>
            previos.some((m) => m.id === nuevo.id) ? previos : [...previos, nuevo]
          );
        }
      )
      .subscribe();

    return () => {
      vigente = false;
      void sb.removeChannel(canal);
    };
  }, [pedidoId]);

  return { mensajes, yo, cargado };
}

// Detecta datos de contacto: la base los rechaza igual, pero avisar antes
// de enviar es mejor experiencia que un error después.
export function tieneDatosPersonales(texto: string): boolean {
  const digitos = texto.replace(/[\s.\-()]/g, "");
  if (/\d{7,}/.test(digitos)) return true;
  if (/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(texto)) return true;
  return /(whatsapp|wasap|whats app|telegram|instagram|insta |facebook|tiktok|snapchat|t\.me\/|wa\.me\/|@[a-z0-9._]{3,})/i.test(
    texto
  );
}

export async function enviarMensaje(
  pedidoId: string,
  texto: string
): Promise<{ ok: boolean; motivo?: "contacto_personal" | "fallo" }> {
  const limpio = texto.trim().slice(0, 500);
  if (!limpio) return { ok: false, motivo: "fallo" };
  if (tieneDatosPersonales(limpio)) {
    return { ok: false, motivo: "contacto_personal" };
  }
  try {
    const usuario = await asegurarSesion();
    const { error } = await supabase().from("mensajes").insert({
      pedido_id: pedidoId,
      autor_id: usuario.id,
      texto: limpio,
    });
    if (!error) return { ok: true };
    return {
      ok: false,
      motivo: error.message.includes("contacto_personal") ? "contacto_personal" : "fallo",
    };
  } catch {
    return { ok: false, motivo: "fallo" };
  }
}
