"use client";

import Link from "next/link";
import {
  ChevronDown,
  MapPin,
  Package,
  Pill,
  Search,
  ShoppingCart,
  User,
  UtensilsCrossed,
} from "lucide-react";
import { useComercios } from "@/features/comercios/store";
import { useDireccion } from "@/features/onboarding/direccion";
import { BottomNav } from "./bottom-nav";
import { ComercioRow } from "./comercio-row";
import { PedidoEnCurso } from "./pedido-en-curso";
import { PedidoLibreCard } from "./pedido-libre-card";

const categorias = [
  { icono: UtensilsCrossed, label: "Comida", tinte: "bg-accent/10 text-accent" },
  { icono: ShoppingCart, label: "Mercado", tinte: "bg-primary/10 text-primary" },
  { icono: Pill, label: "Farmacia", tinte: "bg-success/10 text-success" },
  { icono: Package, label: "Envíos", tinte: "bg-primary/10 text-primary-dark" },
];

export function HomeCliente() {
  const direccion = useDireccion();
  const comercios = useComercios();

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-sm flex-col gap-4 px-4 pb-20">
      {/* Hero de marca */}
      <div className="relative -mx-4 overflow-hidden bg-linear-to-br from-primary to-primary-dark px-4 pb-12 pt-5">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-15 [background-image:radial-gradient(white_1px,transparent_1px)] [background-size:16px_16px]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -top-12 -right-12 size-36 rounded-full bg-accent/30 blur-2xl"
        />
        <div className="relative flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-label font-semibold uppercase tracking-wide text-white/60 font-body">
              Entregar en
            </p>
            <Link
              href="/mapa"
              className="flex max-w-full items-center gap-1 text-body font-semibold font-body text-white"
            >
              <MapPin className="size-4 shrink-0 text-white/80" />
              <span className="truncate">{direccion?.texto ?? "Agrega tu dirección"}</span>
              <ChevronDown className="size-3.5 shrink-0 text-white/60" />
            </Link>
          </div>
          <Link
            href="/perfil"
            aria-label="Tu perfil"
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-white ring-1 ring-white/25"
          >
            <User className="size-4" />
          </Link>
        </div>
        <p className="relative mt-4 font-display text-h2 font-bold text-white">
          ¿Qué necesitas hoy?
        </p>
      </div>

      {/* Buscador flotando sobre el hero */}
      <Link
        href="/buscar"
        className="relative z-10 -mt-10 flex min-h-12 items-center gap-2 rounded-lg border border-border bg-surface px-3 text-body font-body text-muted shadow-[0_12px_30px_rgba(22,35,31,0.12)]"
      >
        <Search className="size-4 text-primary" />
        Busca tiendas o productos
      </Link>

      {/* Diferenciador del producto: va antes de las categorías */}
      <PedidoLibreCard />

      {/* Categorías */}
      <div className="flex flex-col gap-2">
        <h2 className="font-display text-h3 font-semibold text-ink">Categorías</h2>
        <div className="grid grid-cols-4 gap-2">
          {categorias.map(({ icono: Icono, label, tinte }) => (
            <Link
              key={label}
              href={`/buscar?categoria=${label}`}
              className="flex flex-col items-center gap-1.5"
            >
              <span
                className={`flex h-14 w-full items-center justify-center rounded-lg transition-transform duration-300 ease-in-out hover:-translate-y-0.5 ${tinte}`}
              >
                <Icono className="size-5" />
              </span>
              <span className="text-caption font-semibold font-body text-ink">{label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Cerca de ti */}
      <div className="flex flex-col gap-2">
        <h2 className="font-display text-h3 font-semibold text-ink">
          Cerca de ti · llega en 15 min
        </h2>
        {comercios.length === 0 ? (
          <p className="rounded-lg border border-border bg-surface p-4 text-body font-body text-muted">
            No hay tiendas cerca todavía. Escribe lo que necesitas en «Pide lo que sea» y
            un mensajero lo consigue.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {comercios.map((comercio) => (
              <ComercioRow key={comercio.id} comercio={comercio} />
            ))}
          </div>
        )}
      </div>

      {/* Pedido en curso: sticky sobre el nav inferior */}
      <PedidoEnCurso />

      <BottomNav />
    </div>
  );
}
