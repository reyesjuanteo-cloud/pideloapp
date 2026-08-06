"use client";

// Mapa con Google Maps. Se usa solo si existe NEXT_PUBLIC_GOOGLE_MAPS_LLAVE;
// si no, MapaBase (MapLibre) sigue siendo el mapa de la app. La interfaz es
// idéntica a MapaBase para que las pantallas no sepan cuál está activo.
import { useEffect, useRef } from "react";
import type { Marcador } from "./mapa-base";

// Estilo plano y claro, en la línea del STYLE_GUIDE (sin relieve ni ruido).
const ESTILO: google.maps.MapTypeStyle[] = [
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { featureType: "landscape", stylers: [{ color: "#faf8f6" }] },
  { featureType: "water", stylers: [{ color: "#dfe9ee" }] },
];

let promesaCarga: Promise<typeof google.maps> | null = null;

export function hayGoogleMaps(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_LLAVE);
}

function cargarGoogleMaps(): Promise<typeof google.maps> {
  if (promesaCarga) return promesaCarga;
  promesaCarga = new Promise((resolver, rechazar) => {
    if (typeof window !== "undefined" && window.google?.maps) {
      resolver(window.google.maps);
      return;
    }
    const script = document.createElement("script");
    script.src =
      `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_LLAVE}` +
      `&language=es&region=CO&loading=async`;
    script.async = true;
    script.onload = () =>
      window.google?.maps
        ? resolver(window.google.maps)
        : rechazar(new Error("Google Maps no quedó disponible"));
    script.onerror = () => rechazar(new Error("No se pudo cargar Google Maps"));
    document.head.appendChild(script);
  });
  return promesaCarga;
}

export function MapaGoogle({
  centro,
  zoom = 16,
  interactivo = true,
  marcadores = [],
  onMoveEnd,
  className = "",
}: {
  centro: [number, number];
  zoom?: number;
  interactivo?: boolean;
  marcadores?: Marcador[];
  onMoveEnd?: (centro: [number, number]) => void;
  className?: string;
}) {
  const contenedorRef = useRef<HTMLDivElement>(null);
  const mapaRef = useRef<google.maps.Map | null>(null);
  const marcadoresRef = useRef<Map<string, google.maps.Marker>>(new Map());
  const onMoveEndRef = useRef(onMoveEnd);

  useEffect(() => {
    onMoveEndRef.current = onMoveEnd;
  }, [onMoveEnd]);

  useEffect(() => {
    let activo = true;
    void (async () => {
      try {
        const maps = await cargarGoogleMaps();
        if (!activo || !contenedorRef.current || mapaRef.current) return;
        const mapa = new maps.Map(contenedorRef.current, {
          center: { lat: centro[1], lng: centro[0] },
          zoom,
          disableDefaultUI: true,
          gestureHandling: interactivo ? "greedy" : "none",
          clickableIcons: false,
          styles: ESTILO,
        });
        mapa.addListener("idle", () => {
          const c = mapa.getCenter();
          if (c) onMoveEndRef.current?.([c.lng(), c.lat()]);
        });
        mapaRef.current = mapa;
      } catch {
        // Sin conexión con Google: la pantalla queda con el fondo del mapa.
      }
    })();
    return () => {
      activo = false;
    };
    // El centro inicial solo aplica al crear el mapa.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Centro controlado desde afuera (botón de ubicarme, búsqueda de dirección)
  useEffect(() => {
    const mapa = mapaRef.current;
    if (!mapa) return;
    const c = mapa.getCenter();
    if (!c || Math.abs(c.lng() - centro[0]) > 1e-6 || Math.abs(c.lat() - centro[1]) > 1e-6) {
      mapa.panTo({ lat: centro[1], lng: centro[0] });
    }
  }, [centro]);

  // Marcadores declarativos
  useEffect(() => {
    const mapa = mapaRef.current;
    if (!mapa || !window.google?.maps) return;
    const vivos = new Set(marcadores.map((m) => m.id));
    for (const [id, marcador] of marcadoresRef.current) {
      if (!vivos.has(id)) {
        marcador.setMap(null);
        marcadoresRef.current.delete(id);
      }
    }
    for (const m of marcadores) {
      const existente = marcadoresRef.current.get(m.id);
      if (existente) {
        existente.setPosition({ lat: m.lat, lng: m.lng });
      } else {
        marcadoresRef.current.set(
          m.id,
          new window.google.maps.Marker({
            map: mapa,
            position: { lat: m.lat, lng: m.lng },
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 7,
              fillColor: m.color,
              fillOpacity: 1,
              strokeColor: m.anillo ? "#ffffff" : m.color,
              strokeWeight: m.anillo ? 3 : 0,
            },
          })
        );
      }
    }
  }, [marcadores]);

  return <div ref={contenedorRef} className={className} />;
}
