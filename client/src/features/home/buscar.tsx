"use client";

import { useState } from "react";
import { Clock, Search } from "lucide-react";
import { Chip } from "@/components/ui/chip";
import { mockComercios, categorias } from "@/features/customer/mock-comercios";
import { BottomNav } from "./bottom-nav";

const currency = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

export function Buscar({ categoriaInicial }: { categoriaInicial?: string }) {
  const [consulta, setConsulta] = useState("");
  const [categoria, setCategoria] = useState(
    categoriaInicial && categorias.includes(categoriaInicial) ? categoriaInicial : "Todos"
  );

  const resultados = mockComercios.filter((comercio) => {
    const q = normalizar(consulta);
    const coincideCategoria = categoria === "Todos" || comercio.categoria === categoria;
    const coincideConsulta =
      q === "" ||
      normalizar(comercio.nombre).includes(q) ||
      normalizar(comercio.categoria).includes(q);
    return coincideCategoria && coincideConsulta;
  });

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-sm flex-col gap-4 px-4 pb-20 pt-4">
      <h1 className="font-display text-h2 font-semibold text-ink">Buscar</h1>

      <div className="flex min-h-11 items-center gap-2 rounded-md border border-border bg-surface px-3 transition-colors duration-300 ease-in-out focus-within:border-primary">
        <Search className="size-4 shrink-0 text-muted" />
        <input
          autoFocus
          placeholder="Busca tiendas o productos"
          value={consulta}
          onChange={(e) => setConsulta(e.target.value)}
          className="w-full bg-transparent text-body font-body text-ink placeholder:text-muted focus:outline-none"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {categorias.map((c) => (
          <Chip key={c} active={categoria === c} onClick={() => setCategoria(c)}>
            {c}
          </Chip>
        ))}
      </div>

      {resultados.length === 0 ? (
        <p className="rounded-lg border border-border bg-surface p-4 text-body font-body text-muted">
          No encontramos nada con ese nombre. Escríbelo en «Pide lo que sea» del inicio y
          un mensajero lo consigue.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {resultados.map((comercio) => (
            <button
              key={comercio.id}
              className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3 text-left transition-colors duration-300 ease-in-out hover:bg-bg"
            >
              <span className="flex size-10.5 shrink-0 items-center justify-center rounded-md bg-primary/10 font-display text-h3 font-semibold text-primary">
                {comercio.nombre[0]}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-body font-semibold font-body text-ink">
                  {comercio.nombre}
                </p>
                <p className="flex items-center gap-2 text-caption font-body text-muted">
                  <span className="flex items-center gap-1">
                    <Clock className="size-3.5" />
                    {comercio.tiempoMin}–{comercio.tiempoMax} min
                  </span>
                  <span>Envío {currency.format(comercio.costoDomicilio)}</span>
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      <BottomNav />
    </div>
  );
}
