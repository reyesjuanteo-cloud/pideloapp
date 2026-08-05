"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bike } from "lucide-react";
import { leerDireccion } from "./direccion";

export function Splash({ tieneSesion }: { tieneSesion: boolean }) {
  const router = useRouter();
  const [tardando, setTardando] = useState(false);

  useEffect(() => {
    // Mínimo 400 ms de marca; no se prolonga artificialmente más allá.
    const salida = setTimeout(() => {
      if (!tieneSesion) {
        router.replace("/ubicacion");
      } else if (leerDireccion()) {
        router.replace("/home");
      } else {
        router.replace("/mapa");
      }
    }, 600);
    const aviso = setTimeout(() => setTardando(true), 6000);
    return () => {
      clearTimeout(salida);
      clearTimeout(aviso);
    };
  }, [router, tieneSesion]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-primary">
      <div className="flex size-18 items-center justify-center rounded-[22px] bg-white/15">
        <Bike className="size-9 text-white" strokeWidth={2.2} />
      </div>
      <p className="mt-4 font-display text-display font-bold tracking-tight text-white">
        Pídelo
      </p>
      <p className="mt-1 text-caption font-body text-white/70">Lo que sea, en minutos</p>

      <div className="absolute bottom-9 flex items-center gap-1.5">
        <span className="size-1.5 rounded-full bg-white" />
        <span className="size-1.5 rounded-full bg-white/40" />
        <span className="size-1.5 rounded-full bg-white/40" />
      </div>

      {tardando && (
        <button
          onClick={() => router.refresh()}
          className="absolute bottom-16 text-caption font-body text-white/80 underline"
        >
          Está tardando más de lo normal. Reintentar
        </button>
      )}
    </div>
  );
}
