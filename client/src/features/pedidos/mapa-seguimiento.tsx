"use client";

import { Navigation, WifiOff } from "lucide-react";
import {
  CENTRO_ZONA,
  MapaBase,
  distanciaKm,
  type Marcador,
} from "@/components/ui/mapa-base";
import { haceCuanto, usePosicionMensajero } from "./posicion";
import type { Pedido } from "./tipos";

// Mapa de seguimiento con la ubicación REAL del mensajero: su celular la
// reporta durante la entrega y llega aquí por Realtime. Si todavía no hay
// posición (permiso negado, sin señal, pantalla apagada) se dice claramente,
// en vez de inventar un punto que se mueve solo.
export function MapaSeguimiento({ pedido }: { pedido: Pedido }) {
  const posicion = usePosicionMensajero(
    pedido.estado === "preparando" ||
      pedido.estado === "en_camino" ||
      pedido.estado === "llegue"
      ? pedido.mensajeroId
      : undefined
  );

  const tieneDestino =
    pedido.lat !== undefined &&
    pedido.lng !== undefined &&
    distanciaKm([pedido.lng, pedido.lat], CENTRO_ZONA) < 80;
  if (!tieneDestino) return null;

  const destino: [number, number] = [pedido.lng!, pedido.lat!];
  const marcadores: Marcador[] = [
    { id: "destino", lng: destino[0], lat: destino[1], color: "#e8380d" },
  ];

  // Punto de recogida del comercio, cuando lo tiene registrado
  if (pedido.comercioLat !== undefined && pedido.comercioLng !== undefined) {
    marcadores.push({
      id: "recoger",
      lng: pedido.comercioLng,
      lat: pedido.comercioLat,
      color: "#a85e00",
    });
  }

  if (posicion) {
    marcadores.push({
      id: "mensajero",
      lng: posicion.lng,
      lat: posicion.lat,
      color: "#ff9800",
      anillo: true,
      suave: true,
    });
  }

  // Encuadre: entre el mensajero y el destino si hay posición; si no, el destino.
  const centro: [number, number] = posicion
    ? [(posicion.lng + destino[0]) / 2, (posicion.lat + destino[1]) / 2]
    : destino;

  const distancia = posicion
    ? distanciaKm([posicion.lng, posicion.lat], destino)
    : null;
  const frescura = posicion ? haceCuanto(posicion.actualizadoEn) : null;

  return (
    <div className="flex flex-col gap-2">
      <div className="overflow-hidden rounded-lg border border-border">
        <MapaBase
          centro={centro}
          zoom={posicion ? 14 : 15}
          interactivo={false}
          marcadores={marcadores}
          className="h-44 w-full"
        />
      </div>

      {posicion && frescura ? (
        <p
          className={`flex items-center gap-1.5 text-caption font-body ${
            frescura.fresca ? "text-muted" : "text-accent-deep"
          }`}
        >
          <Navigation className="size-3.5 shrink-0" />
          {distancia !== null && distancia < 0.15
            ? "Tu mensajero está en la puerta"
            : distancia !== null
              ? `Tu mensajero está a ${distancia.toFixed(1)} km`
              : "Siguiendo a tu mensajero"}
          <span className="text-muted">· {frescura.texto}</span>
        </p>
      ) : (
        <p className="flex items-center gap-1.5 text-caption font-body text-muted">
          <WifiOff className="size-3.5 shrink-0" />
          Aún no vemos la ubicación de tu mensajero. Escríbele por el chat si lo
          necesitas.
        </p>
      )}
    </div>
  );
}
