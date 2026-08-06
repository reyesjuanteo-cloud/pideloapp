"use client";

import { Mic, MicOff, Phone, PhoneOff } from "lucide-react";
import { useLlamada, type EstadoLlamada } from "./use-llamada";

function reloj(segundos: number): string {
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

const rotulo: Record<EstadoLlamada, string> = {
  inactiva: "",
  llamando: "Llamando…",
  entrante: "Te está llamando",
  conectando: "Conectando…",
  en_curso: "En llamada",
  error: "No se pudo conectar",
};

// Pantalla de llamada. `control` viene de useLlamada() para que el mismo
// estado sirva al botón de llamar y a la llamada entrante.
export function PantallaLlamada({
  control,
  titulo,
}: {
  control: ReturnType<typeof useLlamada>;
  titulo: string;
}) {
  const { estado, detalle, mudo, segundos, audioRef, aceptar, colgar, alternarMudo } =
    control;

  if (estado === "inactiva") {
    // El elemento de audio debe existir siempre para recibir el sonido.
    return <audio ref={audioRef} autoPlay className="hidden" />;
  }

  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-6 bg-ink/95 px-6 text-center">
      <audio ref={audioRef} autoPlay className="hidden" />

      <div className="flex size-24 items-center justify-center rounded-full bg-white/10">
        <Phone
          className={`size-10 text-white ${
            estado === "llamando" || estado === "entrante" ? "animate-pulse" : ""
          }`}
        />
      </div>

      <div>
        <p className="font-display text-h2 font-semibold text-white">{titulo}</p>
        <p className="mt-1 text-body font-body text-white/70">
          {estado === "en_curso" ? reloj(segundos) : rotulo[estado]}
        </p>
        {detalle && (
          <p className="mt-2 max-w-[28ch] text-caption font-body text-white/60">{detalle}</p>
        )}
      </div>

      <div className="flex items-center gap-4">
        {estado === "entrante" && (
          <button
            onClick={aceptar}
            aria-label="Contestar"
            className="flex size-16 items-center justify-center rounded-full bg-success text-white"
          >
            <Phone className="size-7" />
          </button>
        )}

        {(estado === "en_curso" || estado === "conectando") && (
          <button
            onClick={alternarMudo}
            aria-label={mudo ? "Activar micrófono" : "Silenciar micrófono"}
            className="flex size-14 items-center justify-center rounded-full bg-white/10 text-white"
          >
            {mudo ? <MicOff className="size-6" /> : <Mic className="size-6" />}
          </button>
        )}

        <button
          onClick={colgar}
          aria-label="Colgar"
          className="flex size-16 items-center justify-center rounded-full bg-error text-white"
        >
          <PhoneOff className="size-7" />
        </button>
      </div>

      <p className="max-w-[30ch] text-caption font-body text-white/50">
        La llamada va por internet dentro de Pídelo. Ninguno de los dos ve el
        número del otro.
      </p>
    </div>
  );
}
