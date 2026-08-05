"use client";

import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";

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
    <div className="rounded-lg bg-primary/10 p-3.5">
      <p className="font-display text-h3 font-semibold text-primary">Pide lo que sea</p>
      <p className="mt-0.5 text-caption font-body text-primary/80">
        Escríbelo y un mensajero lo consigue por ti
      </p>
      <div className="mt-2.5 flex min-h-11 items-center justify-between gap-2 rounded-md bg-surface px-3">
        <span className="truncate text-body font-body text-muted">{ejemplos[indice]}</span>
        <ArrowRight className="size-4 shrink-0 text-primary" />
      </div>
    </div>
  );
}
