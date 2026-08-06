"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Bike } from "lucide-react";
import { Rayo } from "@/components/ui/rayo";

// Promesas que van rotando bajo la marca.
const frases = [
  "Pide ahora, recíbelo en minutos",
  "Comida caliente, sin salir de casa",
  "¿Se acabó algo? Un mensajero te lo trae",
  "Mercado y farmacia a domicilio",
  "Escribe lo que sea y te lo conseguimos",
];

export function Landing() {
  const [indice, setIndice] = useState(0);

  useEffect(() => {
    const intervalo = setInterval(() => {
      setIndice((i) => (i + 1) % frases.length);
    }, 3200);
    return () => clearInterval(intervalo);
  }, []);

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-white">
      <Rayo className="absolute -left-4 top-16 size-24 -rotate-12 opacity-10" />
      <Rayo className="absolute right-6 top-32 size-8 rotate-12 opacity-25" />
      <Rayo className="absolute -right-6 bottom-56 size-20 rotate-6 opacity-10" />
      <Rayo className="absolute left-8 bottom-48 size-5 -rotate-6 opacity-30" />

      <div className="relative mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center px-6 text-center">
        <Image src="/marca-p.png" alt="PideloApp" width={170} height={170} priority />
        <p className="mt-2 font-display text-display font-bold tracking-tight text-primary">
          PideloApp
        </p>
        {/* Texto rotativo: alto fijo para que los botones no se muevan */}
        <div className="mt-6 flex h-24 items-center">
          <h1
            key={indice}
            className="animate-[aparecer_0.5s_ease-out] max-w-[16ch] font-display text-[30px] font-bold leading-tight text-ink"
          >
            {frases[indice]}
          </h1>
        </div>
        <p className="mt-2 text-body font-body text-muted">
          En Girardot, Ricaurte y Flandes.
        </p>
      </div>

      <div className="relative mx-auto flex w-full max-w-sm flex-col gap-3 px-6 pb-8">
        <Link
          href="/ubicacion"
          className="rounded-md bg-primary py-3.5 text-center text-body font-body font-semibold text-white shadow-[0_10px_25px_rgba(232,56,13,0.28)] transition-transform duration-300 ease-in-out hover:-translate-y-0.5"
        >
          Crear cuenta
        </Link>
        <Link
          href="/ingreso"
          className="rounded-md border border-border bg-white py-3.5 text-center text-body font-body font-semibold text-ink transition-colors duration-300 ease-in-out hover:bg-bg"
        >
          Iniciar sesión
        </Link>

        {/* Acceso para quienes quieren trabajar repartiendo */}
        <Link
          href="/mensajero/registro"
          className="mt-2 flex items-center justify-center gap-2 rounded-md border border-dashed border-primary/40 bg-primary/5 py-3 text-center text-body font-body font-semibold text-primary transition-colors duration-300 ease-in-out hover:bg-primary/10"
        >
          <Bike className="size-4" />
          Quiero ser domiciliario
        </Link>
      </div>
    </div>
  );
}
