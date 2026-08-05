"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, LocateFixed, MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CENTRO_ZONA,
  MapaBase,
  RADIO_COBERTURA_KM,
  distanciaKm,
} from "@/components/ui/mapa-base";
import { guardarDireccion } from "./direccion";

// Dirección aproximada si la geocodificación inversa no responde.
function direccionDeRespaldo(lng: number, lat: number) {
  const cra = Math.min(30, Math.max(1, Math.round(10 + (CENTRO_ZONA[0] - lng) * 900)));
  const calle = Math.min(40, Math.max(1, Math.round(15 + (lat - CENTRO_ZONA[1]) * 900)));
  return { texto: `Cra ${cra} #${calle}`, barrio: "Girardot" };
}

export function Mapa() {
  const router = useRouter();
  const [centro, setCentro] = useState<[number, number]>(CENTRO_ZONA);
  const [texto, setTexto] = useState("Mueve el mapa para ubicar el pin");
  const [barrio, setBarrio] = useState("Centro");
  const [ciudad, setCiudad] = useState("Girardot");
  const [buscando, setBuscando] = useState(false);
  const [interactuado, setInteractuado] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const fueraDeZona = distanciaKm(centro, CENTRO_ZONA) > RADIO_COBERTURA_KM;

  async function alMoverse(nuevoCentro: [number, number]) {
    setCentro(nuevoCentro);
    setInteractuado(true);
    setBuscando(true);

    // Geocodificación inversa con Nominatim (OpenStreetMap). El par lng/lat
    // del pin sigue siendo la fuente de verdad; el texto es informativo.
    abortRef.current?.abort();
    const control = new AbortController();
    abortRef.current = control;
    try {
      const respuesta = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${nuevoCentro[1]}&lon=${nuevoCentro[0]}&zoom=18&accept-language=es`,
        { signal: control.signal }
      );
      const datos = await respuesta.json();
      const d = datos.address ?? {};
      const via = d.road ?? d.pedestrian ?? d.footway;
      const nuevoTexto = via
        ? `${via}${d.house_number ? ` #${d.house_number}` : ""}`
        : (datos.display_name?.split(",")[0] ?? direccionDeRespaldo(...nuevoCentro).texto);
      setTexto(nuevoTexto);
      setBarrio(d.suburb ?? d.neighbourhood ?? d.city_district ?? "Centro");
      setCiudad(d.city ?? d.town ?? d.village ?? d.municipality ?? "Girardot");
    } catch {
      if (!control.signal.aborted) {
        const respaldo = direccionDeRespaldo(...nuevoCentro);
        setTexto(respaldo.texto);
        setBarrio(respaldo.barrio);
      }
    } finally {
      if (!control.signal.aborted) setBuscando(false);
    }
  }

  function recentrar() {
    if (!navigator.geolocation) {
      setCentro([...CENTRO_ZONA]);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const destino: [number, number] = [pos.coords.longitude, pos.coords.latitude];
        // Si el GPS está lejos de la zona (emulador, VPN), volver al centro.
        setCentro(distanciaKm(destino, CENTRO_ZONA) > 60 ? [...CENTRO_ZONA] : destino);
      },
      () => setCentro([...CENTRO_ZONA]),
      { timeout: 8000 }
    );
  }

  function confirmar() {
    guardarDireccion({ texto, barrio, ciudad, lat: centro[1], lng: centro[0] });
    router.push("/entrega");
  }

  return (
    <div className="relative mx-auto h-dvh w-full max-w-sm overflow-hidden">
      <MapaBase centro={centro} zoom={15} onMoveEnd={alMoverse} className="absolute inset-0" />

      {/* Pin fijo al centro */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-full">
        {!interactuado && (
          <div className="absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md border border-border bg-surface px-2.5 py-1.5 text-caption font-body text-ink">
            Mueve el pin al punto exacto
          </div>
        )}
        <MapPin className="size-8 fill-primary text-primary" strokeWidth={1.5} />
        <div className="mx-auto mt-0.5 h-1 w-2.5 rounded-full bg-ink/30" />
      </div>

      {/* Controles flotantes */}
      <div className="absolute inset-x-4 top-4 z-10 flex items-center gap-2">
        <button
          onClick={() => router.back()}
          aria-label="Volver"
          className="flex size-11 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-ink"
        >
          <ArrowLeft className="size-4" />
        </button>
        <div className="flex min-h-11 flex-1 items-center gap-2 rounded-md border border-border bg-surface px-3 text-body font-body text-ink">
          <Search className="size-4 shrink-0 text-muted" />
          <span className={`truncate ${buscando ? "text-muted" : ""}`}>{texto}</span>
        </div>
      </div>

      <button
        onClick={recentrar}
        aria-label="Volver a mi ubicación"
        className="absolute bottom-44 right-4 z-10 flex size-11 items-center justify-center rounded-full border border-border bg-surface text-primary"
      >
        <LocateFixed className="size-4.5" />
      </button>

      {/* Hoja inferior */}
      <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col gap-3 rounded-t-xl border-t border-border bg-surface p-5">
        {fueraDeZona ? (
          <>
            <p className="text-body font-semibold font-body text-accent">
              Todavía no llegamos a esta zona
            </p>
            <p className="text-caption font-body text-muted">
              Por ahora entregamos en Girardot, Ricaurte y Flandes. Mueve el mapa hacia
              allá o{" "}
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
              <p className="text-caption font-body text-muted">{barrio} · {ciudad}</p>
            </div>
            <Button fullWidth onClick={confirmar} disabled={!interactuado && buscando}>
              Confirmar dirección
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
