"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, LocateFixed, MapPin, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CENTRO_ZONA,
  MapaBase,
  RADIO_COBERTURA_KM,
  distanciaKm,
} from "@/components/ui/mapa-base";
import { guardarDireccion, useDireccion, type Direccion } from "./direccion";

type Lugar = {
  texto: string;
  barrio: string;
  ciudad: string;
  lat: number;
  lng: number;
};

export function Mapa() {
  const guardada = useDireccion();
  // key: cuando la dirección guardada aparece tras la hidratación, el selector
  // se remonta y arranca centrado en ella (no en el centro fijo de la zona).
  return <SelectorMapa key={guardada ? "guardada" : "nueva"} guardada={guardada} />;
}

function SelectorMapa({ guardada }: { guardada: Direccion | null }) {
  const router = useRouter();
  const [centro, setCentro] = useState<[number, number]>(
    guardada ? [guardada.lng, guardada.lat] : CENTRO_ZONA
  );
  const [texto, setTexto] = useState(guardada?.texto ?? "Mueve el mapa para ubicar el pin");
  const [barrio, setBarrio] = useState(guardada?.barrio ?? "Centro");
  const [ciudad, setCiudad] = useState(guardada?.ciudad ?? "Girardot");
  const [buscando, setBuscando] = useState(false);
  const [ubicando, setUbicando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [interactuado, setInteractuado] = useState(guardada !== null);

  // Búsqueda por dirección escrita
  const [modoBusqueda, setModoBusqueda] = useState(false);
  const [consulta, setConsulta] = useState("");
  const [resultados, setResultados] = useState<Lugar[]>([]);
  const [buscandoTexto, setBuscandoTexto] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const fueraDeZona = distanciaKm(centro, CENTRO_ZONA) > RADIO_COBERTURA_KM;

  async function alMoverse(nuevoCentro: [number, number]) {
    setCentro(nuevoCentro);
    setInteractuado(true);
    setBuscando(true);

    // El texto se pide a nuestro servidor (OpenStreetMap bloquea al navegador).
    // El par lng/lat del pin sigue siendo la fuente de verdad.
    abortRef.current?.abort();
    const control = new AbortController();
    abortRef.current = control;
    try {
      const r = await fetch(
        `/api/direcciones?lat=${nuevoCentro[1]}&lng=${nuevoCentro[0]}`,
        { signal: control.signal }
      );
      if (!r.ok) throw new Error("sin respuesta");
      const lugar: Lugar = await r.json();
      setTexto(lugar.texto);
      setBarrio(lugar.barrio);
      setCiudad(lugar.ciudad);
      setAviso(null);
    } catch (e) {
      if (!(e instanceof DOMException && e.name === "AbortError")) {
        setTexto("No pudimos leer la dirección aquí");
        setAviso("Busca la dirección o descríbela en las indicaciones del siguiente paso.");
      }
    } finally {
      if (!control.signal.aborted) setBuscando(false);
    }
  }

  function recentrar() {
    setAviso(null);
    if (!navigator.geolocation) {
      setAviso("Tu navegador no permite ubicarte. Mueve el mapa o busca la dirección.");
      return;
    }
    setUbicando(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUbicando(false);
        const destino: [number, number] = [pos.coords.longitude, pos.coords.latitude];
        if (distanciaKm(destino, CENTRO_ZONA) > 60) {
          setAviso("Tu ubicación está lejos de la zona. Te llevamos a Girardot.");
          setCentro([...CENTRO_ZONA]);
        } else {
          setCentro(destino);
        }
      },
      (error) => {
        setUbicando(false);
        setAviso(
          error.code === error.PERMISSION_DENIED
            ? "Permiso de ubicación bloqueado. Actívalo o busca tu dirección."
            : "No pudimos ubicarte. Mueve el mapa o busca tu dirección."
        );
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }

  // Buscar direcciones escritas (con pausa para no consultar en cada tecla)
  useEffect(() => {
    if (!modoBusqueda || consulta.trim().length < 3) return;
    let vigente = true;
    const t = setTimeout(async () => {
      setBuscandoTexto(true);
      try {
        const r = await fetch(`/api/direcciones?q=${encodeURIComponent(consulta)}`);
        const lugares = r.ok ? await r.json() : [];
        if (vigente) setResultados(lugares);
      } catch {
        if (vigente) setResultados([]);
      } finally {
        if (vigente) setBuscandoTexto(false);
      }
    }, 450);
    return () => {
      vigente = false;
      clearTimeout(t);
    };
  }, [consulta, modoBusqueda]);

  function elegirLugar(lugar: Lugar) {
    setCentro([lugar.lng, lugar.lat]);
    setTexto(lugar.texto);
    setBarrio(lugar.barrio);
    setCiudad(lugar.ciudad);
    setInteractuado(true);
    setModoBusqueda(false);
    setConsulta("");
    setResultados([]);
  }

  function confirmar() {
    guardarDireccion({ texto, barrio, ciudad, lat: centro[1], lng: centro[0] });
    router.push("/entrega");
  }

  return (
    <div className="relative mx-auto h-dvh w-full max-w-sm overflow-hidden">
      <MapaBase centro={centro} zoom={16} onMoveEnd={alMoverse} className="absolute inset-0" />

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

      {/* Controles superiores: volver + buscar por dirección */}
      <div className="absolute inset-x-4 top-4 z-20 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => (modoBusqueda ? setModoBusqueda(false) : router.back())}
            aria-label="Volver"
            className="flex size-11 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-ink"
          >
            <ArrowLeft className="size-4" />
          </button>
          {modoBusqueda ? (
            <div className="flex min-h-11 flex-1 items-center gap-2 rounded-md border border-primary bg-surface px-3">
              <Search className="size-4 shrink-0 text-primary" />
              <input
                autoFocus
                value={consulta}
                onChange={(e) => {
                  setConsulta(e.target.value);
                  if (e.target.value.trim().length < 3) setResultados([]);
                }}
                placeholder="Ej: Carrera 10 #15-20"
                className="w-full bg-transparent text-body font-body text-ink placeholder:text-muted focus:outline-none"
              />
              {consulta && (
                <button onClick={() => setConsulta("")} aria-label="Limpiar">
                  <X className="size-4 text-muted" />
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={() => setModoBusqueda(true)}
              className="flex min-h-11 flex-1 items-center gap-2 rounded-md border border-border bg-surface px-3 text-left text-body font-body text-ink"
            >
              <Search className="size-4 shrink-0 text-muted" />
              <span className={`truncate ${buscando ? "text-muted" : ""}`}>{texto}</span>
            </button>
          )}
        </div>

        {modoBusqueda && (
          <div className="max-h-72 overflow-y-auto rounded-md border border-border bg-surface">
            {buscandoTexto && (
              <p className="flex items-center gap-2 p-3 text-caption font-body text-muted">
                <Loader2 className="size-4 animate-spin" />
                Buscando…
              </p>
            )}
            {!buscandoTexto && consulta.trim().length >= 3 && resultados.length === 0 && (
              <p className="p-3 text-caption font-body text-muted">
                No encontramos esa dirección. Intenta con la calle y el número, o
                ubícala moviendo el mapa.
              </p>
            )}
            {resultados.map((lugar, i) => (
              <button
                key={`${lugar.lat}-${lugar.lng}-${i}`}
                onClick={() => elegirLugar(lugar)}
                className={`flex w-full items-start gap-2 p-3 text-left hover:bg-bg ${
                  i > 0 ? "border-t border-border" : ""
                }`}
              >
                <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                <span className="min-w-0">
                  <span className="block truncate text-body font-body text-ink">
                    {lugar.texto}
                  </span>
                  <span className="block text-caption font-body text-muted">
                    {[lugar.barrio, lugar.ciudad].filter(Boolean).join(" · ")}
                  </span>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={recentrar}
        disabled={ubicando}
        aria-label="Volver a mi ubicación"
        className="absolute bottom-48 right-4 z-10 flex size-11 items-center justify-center rounded-full border border-border bg-surface text-primary disabled:opacity-60"
      >
        {ubicando ? (
          <Loader2 className="size-4.5 animate-spin" />
        ) : (
          <LocateFixed className="size-4.5" />
        )}
      </button>

      {/* Hoja inferior */}
      <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col gap-3 rounded-t-xl border-t border-border bg-surface p-5">
        {aviso && <p className="text-caption font-body text-accent-deep">{aviso}</p>}
        {fueraDeZona ? (
          <>
            <p className="text-body font-semibold font-body text-accent-deep">
              Todavía no llegamos a esta zona
            </p>
            <p className="text-caption font-body text-muted">
              Por ahora entregamos en Girardot, Ricaurte y Flandes.
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
              <p className="text-caption font-body text-muted">
                {barrio} · {ciudad}
              </p>
            </div>
            <Button fullWidth onClick={confirmar} disabled={buscando}>
              Confirmar dirección
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
