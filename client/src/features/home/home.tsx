"use client";

import { useEffect, useState } from "react";
import {
  ChevronDown,
  Clock,
  MapPin,
  Package,
  Pill,
  Search,
  ShoppingCart,
  User,
  UtensilsCrossed,
} from "lucide-react";
import { mockComercios } from "@/features/customer/mock-comercios";
import { leerDireccion } from "@/features/onboarding/direccion";
import { BottomNav } from "./bottom-nav";
import { PedidoLibreCard } from "./pedido-libre-card";

const categorias = [
  { icono: UtensilsCrossed, label: "Comida" },
  { icono: ShoppingCart, label: "Mercado" },
  { icono: Pill, label: "Farmacia" },
  { icono: Package, label: "Envíos" },
];

const currency = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

export function HomeCliente() {
  const [direccion, setDireccion] = useState("Agrega tu dirección");

  useEffect(() => {
    const guardada = leerDireccion();
    if (guardada) setDireccion(guardada.texto);
  }, []);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-sm flex-col gap-4 px-4 pb-20 pt-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-label font-semibold uppercase tracking-wide text-muted font-body">
            Entregar en
          </p>
          <button className="flex max-w-full items-center gap-1 text-body font-semibold font-body text-ink">
            <MapPin className="size-4 shrink-0 text-primary" />
            <span className="truncate">{direccion}</span>
            <ChevronDown className="size-3.5 shrink-0 text-muted" />
          </button>
        </div>
        <div
          aria-label="Tu perfil"
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
        >
          <User className="size-4" />
        </div>
      </div>

      {/* Buscador (navega a la búsqueda; aún sin pantalla propia) */}
      <button className="flex min-h-11 items-center gap-2 rounded-md border border-border bg-surface px-3 text-body font-body text-muted">
        <Search className="size-4" />
        Busca tiendas o productos
      </button>

      {/* Diferenciador del producto: va antes de las categorías */}
      <PedidoLibreCard />

      {/* Categorías */}
      <div className="flex flex-col gap-2">
        <h2 className="font-display text-h3 font-semibold text-ink">Categorías</h2>
        <div className="grid grid-cols-4 gap-2">
          {categorias.map(({ icono: Icono, label }) => (
            <button key={label} className="flex flex-col items-center gap-1.5">
              <span className="flex h-13 w-full items-center justify-center rounded-md border border-border bg-surface text-primary transition-colors duration-300 ease-in-out hover:bg-bg">
                <Icono className="size-5" />
              </span>
              <span className="text-caption font-body text-muted">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Cerca de ti */}
      <div className="flex flex-col gap-2">
        <h2 className="font-display text-h3 font-semibold text-ink">
          Cerca de ti · llega en 15 min
        </h2>
        {mockComercios.length === 0 ? (
          <p className="rounded-lg border border-border bg-surface p-4 text-body font-body text-muted">
            No hay tiendas cerca todavía. Escribe lo que necesitas en «Pide lo que sea» y
            un mensajero lo consigue.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {mockComercios.map((comercio) => (
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
      </div>

      {/* Pedido en curso: aparecerá aquí, sticky sobre el nav, cuando exista
          un pedido activo real (vía Supabase). */}

      <BottomNav />
    </div>
  );
}
