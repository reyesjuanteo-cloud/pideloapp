"use client";

import { useEffect, useRef } from "react";
import { Map as MapaGL, Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

// Estilo plano y claro servido por OpenFreeMap (OpenStreetMap) — gratis, sin key.
export const ESTILO_MAPA = "https://tiles.openfreemap.org/styles/positron";

// Centro de Bogotá y radio de cobertura simulado.
export const CENTRO_BOGOTA: [number, number] = [-74.0721, 4.6482];
export const RADIO_COBERTURA_KM = 15;

export function distanciaKm(
  a: [number, number],
  b: [number, number]
): number {
  const rad = Math.PI / 180;
  const dLat = (b[1] - a[1]) * rad;
  const dLng = (b[0] - a[0]) * rad;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a[1] * rad) * Math.cos(b[1] * rad) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

export type Marcador = {
  id: string;
  lng: number;
  lat: number;
  color: string;
  anillo?: boolean; // anillo blanco para el marcador en movimiento
  suave?: boolean; // transición suave entre posiciones
};

export function MapaBase({
  centro,
  zoom = 14,
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
  const mapaRef = useRef<MapaGL | null>(null);
  const marcadoresRef = useRef<Map<string, Marker>>(new Map());
  const onMoveEndRef = useRef(onMoveEnd);
  onMoveEndRef.current = onMoveEnd;

  useEffect(() => {
    if (!contenedorRef.current || mapaRef.current) return;
    const mapa = new MapaGL({
      container: contenedorRef.current,
      style: ESTILO_MAPA,
      center: centro,
      zoom,
      interactive: interactivo,
      attributionControl: { compact: true },
    });
    mapa.on("moveend", () => {
      const c = mapa.getCenter();
      onMoveEndRef.current?.([c.lng, c.lat]);
    });
    mapaRef.current = mapa;
    return () => {
      mapa.remove();
      mapaRef.current = null;
      marcadoresRef.current.clear();
    };
    // El centro/zoom inicial solo aplica al crear el mapa.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Si el centro cambia desde afuera (recentrar), volar hacia él. Tras un
  // moveend el prop coincide con el centro real, así que no hay bucle.
  useEffect(() => {
    const mapa = mapaRef.current;
    if (!mapa) return;
    const c = mapa.getCenter();
    if (Math.abs(c.lng - centro[0]) > 1e-6 || Math.abs(c.lat - centro[1]) > 1e-6) {
      mapa.flyTo({ center: centro });
    }
  }, [centro]);

  // Sincronizar marcadores declarativos con los Markers imperativos de maplibre.
  useEffect(() => {
    const mapa = mapaRef.current;
    if (!mapa) return;
    const vivos = new Set(marcadores.map((m) => m.id));

    for (const [id, marker] of marcadoresRef.current) {
      if (!vivos.has(id)) {
        marker.remove();
        marcadoresRef.current.delete(id);
      }
    }

    for (const m of marcadores) {
      const existente = marcadoresRef.current.get(m.id);
      if (existente) {
        existente.setLngLat([m.lng, m.lat]);
      } else {
        const el = document.createElement("div");
        el.style.width = "14px";
        el.style.height = "14px";
        el.style.borderRadius = "50%";
        el.style.background = m.color;
        if (m.anillo) el.style.border = "3px solid #ffffff";
        if (m.suave) el.style.transition = "transform 1.2s linear";
        const marker = new Marker({ element: el })
          .setLngLat([m.lng, m.lat])
          .addTo(mapa);
        marcadoresRef.current.set(m.id, marker);
      }
    }
  }, [marcadores]);

  return <div ref={contenedorRef} className={className} />;
}
