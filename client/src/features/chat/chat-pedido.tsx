"use client";

import { useEffect, useRef, useState } from "react";
import { Phone, Send, X } from "lucide-react";
import { enviarMensaje, useMensajes } from "./mensajes";

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
  telefono,
  onCerrar,
}: {
  pedidoId: string;
  titulo: string;
  telefono?: string | null;
  onCerrar: () => void;
}) {
  const { mensajes, yo, cargado } = useMensajes(pedidoId);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const finRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes.length]);

  async function enviar() {
    const contenido = texto.trim();
    if (!contenido || enviando) return;
    setEnviando(true);
    setTexto("");
    const r = await enviarMensaje(pedidoId, contenido);
    if (!r.ok) setTexto(contenido); // se conserva para reintentar
    setEnviando(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-bg">
      {/* Cabecera con llamada */}
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
        {telefono && (
          <a
            href={`tel:+57${telefono}`}
            aria-label="Llamar"
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-success/10 text-success"
          >
            <Phone className="size-5" />
          </a>
        )}
      </div>

      {/* Conversación */}
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-4">
        {!cargado && (
          <p className="text-center text-caption font-body text-muted">Cargando…</p>
        )}
        {cargado && mensajes.length === 0 && (
          <p className="mx-auto max-w-[28ch] text-center text-caption font-body text-muted">
            Escríbele para coordinar la entrega. Los mensajes se borran cuando el
            pedido se cierra.
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

      {/* Respuestas rápidas */}
      <div className="flex gap-2 overflow-x-auto px-3 pb-2">
        {rapidas.map((frase) => (
          <button
            key={frase}
            onClick={() => void enviarMensaje(pedidoId, frase)}
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
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && enviar()}
          placeholder="Escribe un mensaje…"
          maxLength={500}
          className="min-h-11 flex-1 rounded-full border border-border bg-bg px-4 text-body font-body text-ink placeholder:text-muted focus:outline-none focus:border-primary"
        />
        <button
          onClick={enviar}
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
