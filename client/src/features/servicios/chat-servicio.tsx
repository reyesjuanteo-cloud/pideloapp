"use client";

// Chat de un servicio contratado. La censura de teléfonos y redes ocurre en
// la base de datos: si el mensaje sale bloqueado, el otro nunca lo recibe y
// aquí se muestra el aviso de seguridad.
import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send, ShieldAlert } from "lucide-react";
import { supabase } from "@/lib/supabase/cliente";

type Mensaje = {
  id: string;
  autorId: string;
  texto: string;
  bloqueado: boolean;
  creadoEn: string;
};

const AVISO_SEGURIDAD =
  "Por tu seguridad y para conservar la protección de Pídelo (historial, soporte y disputas), mantén la comunicación dentro de la plataforma.";

export function ChatServicio({ solicitudId }: { solicitudId: string }) {
  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [miId, setMiId] = useState<string | null>(null);
  const [avisoBloqueo, setAvisoBloqueo] = useState(false);
  const finRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return;
    let vigente = true;
    const sb = supabase();

    void (async () => {
      const {
        data: { session },
      } = await sb.auth.getSession();
      if (!session || !vigente) return;
      setMiId(session.user.id);
      const { data } = await sb
        .from("mensajes_servicio")
        .select("id, autor_id, texto, bloqueado, creado_en")
        .eq("solicitud_id", solicitudId)
        .order("creado_en");
      if (vigente && data) {
        setMensajes(
          data.map((m) => ({
            id: m.id as string,
            autorId: m.autor_id as string,
            texto: m.texto as string,
            bloqueado: m.bloqueado as boolean,
            creadoEn: m.creado_en as string,
          }))
        );
      }
    })();

    const canal = sb
      .channel(`chat-servicio-${solicitudId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "mensajes_servicio",
          filter: `solicitud_id=eq.${solicitudId}`,
        },
        (evento) => {
          const m = evento.new as {
            id: string;
            autor_id: string;
            texto: string;
            bloqueado: boolean;
            creado_en: string;
          };
          setMensajes((prev) =>
            prev.some((x) => x.id === m.id)
              ? prev
              : [
                  ...prev,
                  {
                    id: m.id,
                    autorId: m.autor_id,
                    texto: m.texto,
                    bloqueado: m.bloqueado,
                    creadoEn: m.creado_en,
                  },
                ]
          );
        }
      )
      .subscribe();

    return () => {
      vigente = false;
      void sb.removeChannel(canal);
    };
  }, [abierto, solicitudId]);

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes.length]);

  async function enviar() {
    const limpio = texto.trim();
    if (!limpio || enviando || !miId) return;
    setEnviando(true);
    setAvisoBloqueo(false);
    const { data } = await supabase()
      .from("mensajes_servicio")
      .insert({ solicitud_id: solicitudId, autor_id: miId, texto: limpio })
      .select("id, bloqueado")
      .single();
    if (data?.bloqueado) {
      setAvisoBloqueo(true);
      setMensajes((prev) =>
        prev.some((x) => x.id === (data.id as string))
          ? prev
          : [
              ...prev,
              {
                id: data.id as string,
                autorId: miId,
                texto: limpio,
                bloqueado: true,
                creadoEn: new Date().toISOString(),
              },
            ]
      );
    }
    setTexto("");
    setEnviando(false);
  }

  if (!abierto) {
    return (
      <button
        onClick={() => setAbierto(true)}
        className="flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-border bg-bg text-body font-semibold font-body text-ink hover:bg-surface"
      >
        <MessageCircle className="size-4 text-primary" />
        Abrir chat
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border border-border bg-bg p-2.5">
      <div className="flex max-h-56 flex-col gap-1.5 overflow-y-auto">
        {mensajes.length === 0 && (
          <p className="p-2 text-center text-caption font-body text-muted">
            Coordina por aquí: queda registrado y cuenta con el soporte de Pídelo.
          </p>
        )}
        {mensajes.map((m) => (
          <div
            key={m.id}
            className={`max-w-[85%] rounded-lg px-3 py-1.5 text-body font-body ${
              m.bloqueado
                ? "self-end border border-dashed border-error/50 bg-error/5 text-muted line-through"
                : m.autorId === miId
                  ? "self-end bg-primary text-white"
                  : "self-start bg-surface text-ink"
            }`}
          >
            {m.texto}
          </div>
        ))}
        <div ref={finRef} />
      </div>

      {avisoBloqueo && (
        <p className="flex items-start gap-1.5 rounded-md bg-accent/10 p-2 text-caption font-body text-accent-deep">
          <ShieldAlert className="mt-0.5 size-3.5 shrink-0" />
          {AVISO_SEGURIDAD}
        </p>
      )}

      <div className="flex gap-2">
        <input
          placeholder="Escribe un mensaje…"
          value={texto}
          onChange={(e) => setTexto(e.target.value.slice(0, 1000))}
          onKeyDown={(e) => e.key === "Enter" && void enviar()}
          className="min-h-10 flex-1 rounded-md border border-border bg-surface px-3 text-body font-body text-ink placeholder:text-muted focus:outline-none focus:border-primary"
        />
        <button
          onClick={() => void enviar()}
          disabled={enviando}
          aria-label="Enviar"
          className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary text-white"
        >
          <Send className="size-4" />
        </button>
      </div>
    </div>
  );
}
