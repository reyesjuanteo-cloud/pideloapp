"use client";

// Ubicación real del mensajero durante una entrega.
//
// El celular del mensajero reporta su GPS mientras tiene un pedido activo, y
// el del cliente lo recibe por Realtime. Dos cuidados deliberados:
//   · Solo se reporta con una entrega en curso y la app en pantalla, para no
//     vaciar la batería.
//   · Se guarda cada 10 segundos como máximo, aunque el GPS avise más seguido.
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase/cliente";

const CADA_MS = 10000;

export type PosicionMensajero = {
  lat: number;
  lng: number;
  actualizadoEn: string;
};

// --- Lado del mensajero: reportar ---
export function useReportarPosicion(hayEntregaActiva: boolean) {
  const ultimoEnvio = useRef(0);

  useEffect(() => {
    if (!hayEntregaActiva || typeof navigator === "undefined" || !navigator.geolocation) {
      return;
    }

    let vigilancia: number | null = null;

    const guardar = async (pos: GeolocationPosition) => {
      const ahora = Date.now();
      if (ahora - ultimoEnvio.current < CADA_MS) return;
      ultimoEnvio.current = ahora;
      const sb = supabase();
      const {
        data: { session },
      } = await sb.auth.getSession();
      if (!session) return;
      await sb.from("posiciones_mensajero").upsert({
        mensajero_id: session.user.id,
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        actualizado_en: new Date().toISOString(),
      });
    };

    const iniciar = () => {
      if (vigilancia !== null) return;
      vigilancia = navigator.geolocation.watchPosition(
        (pos) => void guardar(pos),
        () => {
          // Permiso negado o sin señal: el cliente verá la última posición
          // conocida y el aviso de que no está actualizada.
        },
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 }
      );
    };

    const detener = () => {
      if (vigilancia !== null) {
        navigator.geolocation.clearWatch(vigilancia);
        vigilancia = null;
      }
    };

    // Con la app en segundo plano el navegador corta el GPS igualmente:
    // se detiene a propósito para no gastar batería en vano.
    const alCambiarVisibilidad = () =>
      document.visibilityState === "visible" ? iniciar() : detener();

    iniciar();
    document.addEventListener("visibilitychange", alCambiarVisibilidad);
    return () => {
      detener();
      document.removeEventListener("visibilitychange", alCambiarVisibilidad);
    };
  }, [hayEntregaActiva]);
}

// --- Lado del cliente: seguir ---
export function usePosicionMensajero(
  mensajeroId: string | undefined
): PosicionMensajero | null {
  const [posicion, setPosicion] = useState<PosicionMensajero | null>(null);

  useEffect(() => {
    if (!mensajeroId) return;
    let vigente = true;
    const sb = supabase();

    const leer = (fila: { lat: number; lng: number; actualizado_en: string }) => ({
      lat: fila.lat,
      lng: fila.lng,
      actualizadoEn: fila.actualizado_en,
    });

    void (async () => {
      const { data } = await sb
        .from("posiciones_mensajero")
        .select("lat, lng, actualizado_en")
        .eq("mensajero_id", mensajeroId)
        .maybeSingle();
      if (vigente && data) setPosicion(leer(data as never));
    })();

    const canal = sb
      .channel(`posicion-${mensajeroId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "posiciones_mensajero",
          filter: `mensajero_id=eq.${mensajeroId}`,
        },
        (evento) => setPosicion(leer(evento.new as never))
      )
      .subscribe();

    return () => {
      vigente = false;
      void sb.removeChannel(canal);
      setPosicion(null);
    };
  }, [mensajeroId]);

  return posicion;
}

// "hace 8 segundos" / "hace 3 minutos": el cliente necesita saber si el punto
// está vivo o congelado (mensajero con la pantalla apagada, sin señal).
export function haceCuanto(iso: string): { texto: string; fresca: boolean } {
  const segundos = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (segundos < 30) return { texto: "ahora mismo", fresca: true };
  if (segundos < 90) return { texto: "hace un momento", fresca: true };
  if (segundos < 3600) {
    return { texto: `hace ${Math.round(segundos / 60)} min`, fresca: segundos < 180 };
  }
  return { texto: "hace rato", fresca: false };
}
