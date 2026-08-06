"use client";

import { useEffect, useRef, useState } from "react";
import { Phone, Send, ShieldAlert, X } from "lucide-react";
import { PantallaLlamada } from "@/features/llamada/llamada";
import { useLlamada } from "@/features/llamada/use-llamada";
import { enviarMensaje, tieneDatosPersonales, useMensajes } from "./mensajes";

// Respuestas rápidas: en moto o con las manos ocupadas, escribir es difícil.
const rapidas = [
  "Ya voy en camino",
  "Estoy en la puerta",
  "¿Me confirmas la dirección?",
  "Salgo en 2 minutos",
];

export function ChatPedido({
  pedidoId,
  titulo,
  onCerrar,
}: {
  pedidoId: string;
  titulo: string;
  onCerrar: () => void;
}) {
  const { mensajes, yo, cargado } = useMensajes(pedidoId);
  const llamada = useLlamada(pedidoId, yo);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const finRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes.length]);

  async function enviar(contenido: string) {
    const limpio = contenido.trim();
    if (!limpio || enviando) return;
    // Aviso inmediato antes de siquiera intentarlo (la base también lo impide).
    if (tieneDatosPersonales(limpio)) {
      setAviso(
        "Por tu seguridad no compartas teléfonos, correos ni redes. Usa la llamada de Pídelo."
      );
      return;
    }
    setEnviando(true);
    setAviso(null);
    const previo = texto;
    setTexto("");
    const r = await enviarMensaje(pedidoId, limpio);
    if (!r.ok) {
      setTexto(previo);
      setAviso(
        r.motivo === "contacto_personal"
          ? "Ese mensaje contiene datos de contacto. Usa la llamada de Pídelo."
          : "No se pudo enviar. Revisa tu conexión."
      );
    }
    setEnviando(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-bg">
      <PantallaLlamada control={llamada} titulo={titulo} />

      {/* Cabecera con llamada dentro de la app */}
      <div className="flex items-center gap-3 border-b border-border bg-surface p-3">
        <button
          onClick={onCerrar}
          aria-label="Cerrar chat"
          className="flex size-11 shrink-0 items-center justify-center rounded-full text-ink"
        >
          <X className="size-5" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-body font-semibold font-body text-ink">{titulo}</p>
          <p className="text-caption font-body text-muted">Chat del pedido</p>
        </div>
        <button
          onClick={llamada.llamar}
          aria-label="Llamar por la app"
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-success/10 text-success"
        >
          <Phone className="size-5" />
        </button>
      </div>

      {/* Recordatorio de seguridad */}
      <div className="flex items-start gap-2 bg-accent/10 px-4 py-2.5">
        <ShieldAlert className="mt-0.5 size-4 shrink-0 text-accent-deep" />
        <p className="text-caption font-body text-accent-deep">
          Por tu seguridad, no compartas ni pidas teléfonos, correos o redes
          sociales. Habla y llama solo por Pídelo: así queda registro si algo pasa.
        </p>
      </div>

      {/* Conversación */}
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-4">
        {!cargado && (
          <p className="text-center text-caption font-body text-muted">Cargando…</p>
        )}
        {cargado && mensajes.length === 0 && (
          <p className="mx-auto max-w-[28ch] text-center text-caption font-body text-muted">
            Escríbele para coordinar la entrega.
          </p>
        )}
        {mensajes.map((m) => {
          const mio = m.autorId === yo;
          return (
            <div
              key={m.id}
              className={`flex max-w-[80%] flex-col gap-0.5 rounded-lg px-3 py-2 ${
                mio
                  ? "self-end bg-primary text-white"
                  : "self-start border border-border bg-surface text-ink"
              }`}
            >
              <p className="text-body font-body">{m.texto}</p>
              <p
                className={`text-right text-[10px] font-body ${
                  mio ? "text-white/60" : "text-muted"
                }`}
              >
                {m.hora}
              </p>
            </div>
          );
        })}
        <div ref={finRef} />
      </div>

      {aviso && (
        <p className="mx-3 mb-2 rounded-md bg-error/10 p-2.5 text-caption font-body text-error">
          {aviso}
        </p>
      )}

      {/* Respuestas rápidas */}
      <div className="flex gap-2 overflow-x-auto px-3 pb-2">
        {rapidas.map((frase) => (
          <button
            key={frase}
            onClick={() => void enviar(frase)}
            className="shrink-0 rounded-full border border-border bg-surface px-3 py-1.5 text-caption font-body text-ink"
          >
            {frase}
          </button>
        ))}
      </div>

      {/* Escribir */}
      <div className="flex items-center gap-2 border-t border-border bg-surface p-3">
        <input
          value={texto}
          onChange={(e) => {
            setTexto(e.target.value);
            if (aviso) setAviso(null);
          }}
          onKeyDown={(e) => e.key === "Enter" && enviar(texto)}
          placeholder="Escribe un mensaje…"
          maxLength={500}
          className="min-h-11 flex-1 rounded-full border border-border bg-bg px-4 text-body font-body text-ink placeholder:text-muted focus:outline-none focus:border-primary"
        />
        <button
          onClick={() => enviar(texto)}
          disabled={!texto.trim() || enviando}
          aria-label="Enviar"
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-white disabled:opacity-45"
        >
          <Send className="size-4.5" />
        </button>
      </div>
    </div>
  );
}
