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
        router.replace("/bienvenida");
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
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-linear-to-br from-primary to-primary-dark">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-15 [background-image:radial-gradient(white_1px,transparent_1px)] [background-size:16px_16px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-16 -right-16 size-48 rounded-full bg-accent/30 blur-2xl"
      />
      <div className="relative flex size-18 items-center justify-center rounded-[22px] bg-white/15 ring-1 ring-white/25">
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
