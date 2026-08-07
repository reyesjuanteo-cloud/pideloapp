"use client";

import Link from "next/link";
import { ChevronDown, ChevronRight, MapPin, Store, User } from "lucide-react";
import { Rayo } from "@/components/ui/rayo";
import { useEstadoComercios } from "@/features/comercios/store";
import { useDireccion } from "@/features/onboarding/direccion";
import { primerNombre, usePerfilCliente } from "@/features/onboarding/perfil-cliente";
import { useCategoriasServicio } from "@/features/servicios/datos";
import { BottomNav } from "./bottom-nav";
import { ComercioRow } from "./comercio-row";
import { PedidoEnCurso } from "./pedido-en-curso";

export function HomeCliente() {
  const direccion = useDireccion();
  const { datos: comercios } = useEstadoComercios();
  const categorias = useCategoriasServicio();
  const nombre = primerNombre(usePerfilCliente()?.nombre);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-sm flex-col gap-4 bg-white px-4 pb-20">
      {/* Cabecera con el rayo de la marca */}
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
          {nombre ? `Hola ${nombre}, ¿qué necesitas hoy?` : "¿Qué necesitas hoy?"}
          <Rayo className="size-5 shrink-0" />
        </p>
      </div>

      {/* EL corazón de Pídelo: la subasta */}
      <Link
        href="/servicios"
        className="flex flex-col gap-1 rounded-lg bg-primary p-4 text-white shadow-[0_12px_28px_rgba(232,56,13,0.35)] transition-transform duration-300 ease-in-out hover:-translate-y-0.5"
      >
        <span className="flex items-center gap-2 font-display text-h2 font-bold">
          Pide lo que sea
          <Rayo className="size-5" />
        </span>
        <span className="text-body font-body text-white/90">
          Un mandado, un domicilio, un arreglo… Tú dices cuánto ofreces y los que
          saben se postulan con su precio. Tú comparas y eliges.
        </span>
      </Link>

      {/* Categorías reales de la subasta */}
      <div className="flex flex-col gap-2">
        <h2 className="font-display text-h3 font-semibold text-ink">
          ¿Con qué te ayudamos?
        </h2>
        <div className="flex flex-wrap gap-2">
          {categorias.map((categoria) => (
            <Link
              key={categoria.id}
              href={`/servicios?categoria=${encodeURIComponent(categoria.nombre)}`}
              className="rounded-full border border-border bg-surface px-3.5 py-2 text-caption font-semibold font-body text-ink transition-colors duration-300 ease-in-out hover:border-primary hover:text-primary"
            >
              {categoria.nombre}
            </Link>
          ))}
        </div>
      </div>

      {/* Tiendas aliadas: catálogo directo, sin subasta */}
      {comercios.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-1.5 font-display text-h3 font-semibold text-ink">
              <Store className="size-4 text-primary" />
              Tiendas aliadas
            </h2>
            <Link
              href="/buscar"
              className="flex items-center text-caption font-body text-primary hover:text-primary-dark"
            >
              Ver todas
              <ChevronRight className="size-3.5" />
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            {comercios.slice(0, 3).map((comercio) => (
              <ComercioRow key={comercio.id} comercio={comercio} />
            ))}
          </div>
        </div>
      )}

      {/* Pedido en curso: sticky sobre el nav inferior */}
      <PedidoEnCurso />

      <BottomNav />
    </div>
  );
}
