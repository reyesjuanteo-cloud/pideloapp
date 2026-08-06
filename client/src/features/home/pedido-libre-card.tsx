"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

const ejemplos = [
  "Un cargador tipo C",
  "Acetaminofén y suero oral",
  "Las llaves que dejé donde mi mamá",
  "Un ramo de flores para hoy",
];

export function PedidoLibreCard() {
  const [indice, setIndice] = useState(0);

  useEffect(() => {
    const intervalo = setInterval(() => {
      setIndice((i) => (i + 1) % ejemplos.length);
    }, 3500);
    return () => clearInterval(intervalo);
  }, []);

  return (
    <Link
      href="/pedido-libre"
      className="relative block overflow-hidden rounded-lg bg-linear-to-br from-primary to-primary-dark p-4 transition-transform duration-300 ease-in-out hover:-translate-y-0.5"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-15 [background-image:radial-gradient(white_1px,transparent_1px)] [background-size:16px_16px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-10 -right-8 size-28 rounded-full bg-accent/40 blur-2xl"
      />
      <p className="relative flex items-center gap-1.5 font-display text-h3 font-bold text-white">
        <Sparkles className="size-4 text-accent" />
        Pide lo que sea
      </p>
      <p className="relative mt-0.5 text-caption font-body text-white/70">
        Escríbelo y un mensajero lo consigue por ti
      </p>
      <div className="relative mt-3 flex min-h-11 items-center justify-between gap-2 rounded-md bg-surface px-3">
        <span className="truncate text-body font-body text-muted">{ejemplos[indice]}</span>
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent text-white">
          <ArrowRight className="size-4" />
        </span>
      </div>
    </Link>
  );
}
