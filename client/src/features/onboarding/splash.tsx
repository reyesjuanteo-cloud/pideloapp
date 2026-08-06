"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Rayo } from "@/components/ui/rayo";
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
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-white">
      <Rayo className="absolute -left-3 top-20 size-20 -rotate-12 opacity-10" />
      <Rayo className="absolute right-8 top-36 size-6 rotate-12 opacity-25" />
      <Rayo className="absolute -right-5 bottom-40 size-16 rotate-6 opacity-10" />
      <Image
        src="/marca-p.png"
        alt="Pídelo"
        width={130}
        height={130}
        priority
        className="relative"
      />
      <p className="mt-2 font-display text-display font-bold tracking-tight text-primary">
        PideloApp
      </p>
      <p className="mt-1 text-caption font-body text-muted">Lo que sea, en minutos</p>

      <div className="absolute bottom-9 flex items-center gap-1.5">
        <span className="size-1.5 rounded-full bg-primary" />
        <span className="size-1.5 rounded-full bg-primary/30" />
        <span className="size-1.5 rounded-full bg-primary/30" />
      </div>

      {tardando && (
        <button
          onClick={() => router.refresh()}
          className="absolute bottom-16 text-caption font-body text-muted underline"
        >
          Está tardando más de lo normal. Reintentar
        </button>
      )}
    </div>
  );
}
