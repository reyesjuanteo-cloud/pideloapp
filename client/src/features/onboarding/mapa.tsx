"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, LocateFixed, MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { guardarDireccion } from "./direccion";

const RADIO_COBERTURA = 280;

// La dirección se deriva del desplazamiento del pin de forma determinista.
// Con geocodificación real, esto será una consulta inversa lat/lng → dirección.
function direccionDesdeOffset(x: number, y: number) {
  const cra = Math.min(170, Math.max(1, 13 + Math.round(-x / 60)));
  const calle = Math.min(200, Math.max(1, 85 + Math.round(y / 60)));
  const placa = 10 + (Math.abs(Math.round(x / 30) + Math.round(y / 30)) % 60);
  const barrio =
    x >= 0 && y >= 0
      ? "Chapinero"
      : x < 0 && y >= 0
        ? "Teusaquillo"
        : x >= 0
          ? "Chicó Norte"
          : "La Soledad";
  return { texto: `Cra ${cra} #${calle}-${placa}`, barrio };
}

export function Mapa() {
  const router = useRouter();
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [interactuado, setInteractuado] = useState(false);
  const arrastre = useRef<{ x: number; y: number } | null>(null);

  const { texto, barrio } = direccionDesdeOffset(offset.x, offset.y);
  const fueraDeZona = Math.hypot(offset.x, offset.y) > RADIO_COBERTURA;

  function confirmar() {
    guardarDireccion({ texto, barrio, lat: offset.y, lng: offset.x });
    router.push("/entrega");
  }

  return (
    <div className="relative mx-auto h-dvh w-full max-w-sm overflow-hidden">
      {/* Mapa plano simulado: manzanas blancas, calles en color border, parques.
          El fondo se desplaza; el pin queda fijo al centro. */}
      <div
        className="absolute inset-0 cursor-grab touch-none active:cursor-grabbing"
        style={{
          backgroundColor: "var(--color-surface)",
          backgroundImage: [
            "radial-gradient(circle 46px at 130px 110px, color-mix(in srgb, var(--color-success) 12%, transparent) 0 100%, transparent 100%)",
            "repeating-linear-gradient(0deg, var(--color-border) 0 3px, transparent 3px 96px)",
            "repeating-linear-gradient(90deg, var(--color-border) 0 3px, transparent 3px 96px)",
          ].join(", "),
          backgroundSize: "520px 520px, auto, auto",
          backgroundPosition: `${offset.x}px ${offset.y}px`,
        }}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          arrastre.current = { x: e.clientX, y: e.clientY };
          setInteractuado(true);
        }}
        onPointerMove={(e) => {
          if (!arrastre.current) return;
          const dx = e.clientX - arrastre.current.x;
          const dy = e.clientY - arrastre.current.y;
          arrastre.current = { x: e.clientX, y: e.clientY };
          setOffset((o) => ({ x: o.x + dx, y: o.y + dy }));
        }}
        onPointerUp={() => (arrastre.current = null)}
      />

      {/* Pin fijo al centro */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full">
        {!interactuado && (
          <div className="absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md border border-border bg-surface px-2.5 py-1.5 text-caption font-body text-ink">
            Mueve el pin al punto exacto
          </div>
        )}
        <MapPin className="size-8 fill-primary text-primary" strokeWidth={1.5} />
        <div className="mx-auto mt-0.5 h-1 w-2.5 rounded-full bg-ink/30" />
      </div>

      {/* Controles flotantes */}
      <div className="absolute inset-x-4 top-4 flex items-center gap-2">
        <button
          onClick={() => router.back()}
          aria-label="Volver"
          className="flex size-11 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-ink"
        >
          <ArrowLeft className="size-4" />
        </button>
        <div className="flex min-h-11 flex-1 items-center gap-2 rounded-md border border-border bg-surface px-3 text-body font-body text-ink">
          <Search className="size-4 shrink-0 text-muted" />
          <span className="truncate">{texto}</span>
        </div>
      </div>

      <button
        onClick={() => setOffset({ x: 0, y: 0 })}
        aria-label="Volver a mi ubicación"
        className="absolute bottom-44 right-4 flex size-11 items-center justify-center rounded-full border border-border bg-surface text-primary"
      >
        <LocateFixed className="size-4.5" />
      </button>

      {/* Hoja inferior */}
      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 rounded-t-xl border-t border-border bg-surface p-5">
        {fueraDeZona ? (
          <>
            <p className="text-body font-semibold font-body text-accent">
              Todavía no llegamos a esta zona
            </p>
            <p className="text-caption font-body text-muted">
              Mueve el mapa hacia el centro de Bogotá o{" "}
              <button className="text-primary">avísame cuando lleguen</button>.
            </p>
            <Button fullWidth disabled>
              Confirmar dirección
            </Button>
          </>
        ) : (
          <>
            <div>
              <p className="text-label font-semibold uppercase tracking-wide text-muted font-body">
                Entregar en
              </p>
              <p className="mt-0.5 font-display text-h3 font-semibold text-ink">{texto}</p>
              <p className="text-caption font-body text-muted">{barrio} · Bogotá</p>
            </div>
            <Button fullWidth onClick={confirmar}>
              Confirmar dirección
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
