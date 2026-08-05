"use client";

import { useEffect, useState } from "react";
import {
  CENTRO_ZONA,
  MapaBase,
  distanciaKm,
  type Marcador,
} from "@/components/ui/mapa-base";
import type { Pedido } from "./tipos";

// ⚠️ TEMPORAL: la posición del mensajero es simulada. Con Supabase, el celular
// del mensajero reportará su ubicación real (watchPosition → tabla → realtime).

// Punto de partida determinista (el "comercio"), a ~1.8 km del destino.
function origenDe(pedido: Pedido, destino: [number, number]): [number, number] {
  const rumbo = ((Number(pedido.id) * 47) % 360) * (Math.PI / 180);
  const dKm = 1.8;
  const dLat = (dKm * Math.cos(rumbo)) / 111;
  const dLng =
    (dKm * Math.sin(rumbo)) / (111 * Math.cos(destino[1] * (Math.PI / 180)));
  return [destino[0] + dLng, destino[1] + dLat];
}

export function MapaSeguimiento({ pedido }: { pedido: Pedido }) {
  const [progreso, setProgreso] = useState(0);

  const tieneCoords =
    pedido.lat !== undefined &&
    pedido.lng !== undefined &&
    distanciaKm([pedido.lng, pedido.lat], CENTRO_ZONA) < 80;

  useEffect(() => {
    if (pedido.estado !== "en_camino") return;
    const intervalo = setInterval(() => {
      setProgreso((p) => Math.min(0.96, p + 0.02));
    }, 1200);
    return () => clearInterval(intervalo);
  }, [pedido.estado]);

  if (!tieneCoords) return null;

  const destino: [number, number] = [pedido.lng!, pedido.lat!];
  const origen = origenDe(pedido, destino);

  let mensajero: [number, number] | null = null;
  if (pedido.estado === "preparando") {
    mensajero = origen;
  } else if (pedido.estado === "en_camino") {
    mensajero = [
      origen[0] + (destino[0] - origen[0]) * progreso,
      origen[1] + (destino[1] - origen[1]) * progreso,
    ];
  } else if (pedido.estado === "llegue" || pedido.estado === "entregado") {
    mensajero = destino;
  }

  const marcadores: Marcador[] = [
    { id: "destino", lng: destino[0], lat: destino[1], color: "#0e5c56" },
  ];
  if (mensajero) {
    marcadores.push({
      id: "mensajero",
      lng: mensajero[0],
      lat: mensajero[1],
      color: "#ff6a39",
      anillo: true,
      suave: true,
    });
  }

  const centro: [number, number] = [
    (origen[0] + destino[0]) / 2,
    (origen[1] + destino[1]) / 2,
  ];

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <MapaBase
        centro={centro}
        zoom={13.2}
        interactivo={false}
        marcadores={marcadores}
        className="h-44 w-full"
      />
    </div>
  );
}
