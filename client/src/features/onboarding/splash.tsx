"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
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
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-surface">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-25 [background-image:radial-gradient(var(--color-accent)_1.5px,transparent_1.5px)] [background-size:18px_18px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-16 -right-16 size-48 rounded-full bg-accent/15 blur-3xl"
      />
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
