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
import { Rayo } from "@/components/ui/rayo";
import { useEstadoComercios } from "@/features/comercios/store";
import { useDireccion } from "@/features/onboarding/direccion";
import { BottomNav } from "./bottom-nav";
import { ComercioRow } from "./comercio-row";
import { PedidoEnCurso } from "./pedido-en-curso";
import { PedidoLibreCard } from "./pedido-libre-card";

const categorias = [
  { icono: UtensilsCrossed, label: "Comida", tinte: "bg-accent/10 text-accent-deep" },
  { icono: ShoppingCart, label: "Mercado", tinte: "bg-primary/10 text-primary" },
  { icono: Pill, label: "Farmacia", tinte: "bg-success/10 text-success" },
  { icono: Package, label: "Envíos", tinte: "bg-primary/10 text-primary-dark" },
];

export function HomeCliente() {
  const direccion = useDireccion();
  const { datos: comercios, cargado, error } = useEstadoComercios();

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-sm flex-col gap-4 bg-white px-4 pb-20">
      {/* Cabecera blanca con el rayo de la marca */}
      <div className="relative pt-5">
        <Rayo className="pointer-events-none absolute -right-2 top-6 size-20 rotate-12 opacity-10" />
        <div className="relative flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-label font-semibold uppercase tracking-wide text-muted font-body">
              Entregar en
            </p>
            <Link
              href="/mapa"
              className="flex max-w-full items-center gap-1 text-body font-semibold font-body text-ink"
            >
              <MapPin className="size-4 shrink-0 text-primary" />
              <span className="truncate">{direccion?.texto ?? "Agrega tu dirección"}</span>
              <ChevronDown className="size-3.5 shrink-0 text-muted" />
            </Link>
          </div>
          <Link
            href="/perfil"
            aria-label="Tu perfil"
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
          >
            <User className="size-4" />
          </Link>
        </div>
        <p className="relative mt-4 flex items-center gap-1.5 font-display text-h2 font-bold text-ink">
          ¿Qué necesitas hoy?
          <Rayo className="size-5" />
        </p>
      </div>

      {/* Buscador */}
      <Link
        href="/buscar"
        className="flex min-h-12 items-center gap-2 rounded-lg border border-border bg-white px-3 text-body font-body text-muted shadow-[0_8px_24px_rgba(36,26,20,0.08)]"
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
            {!cargado
              ? "Buscando comercios cerca de ti…"
              : error
                ? "No pudimos conectarnos. Revisa tu internet y vuelve a entrar."
                : "No hay tiendas cerca todavía. Escribe lo que necesitas en «Pide lo que sea» y un mensajero lo consigue."}
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
