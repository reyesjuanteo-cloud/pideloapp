"use client";

import Link from "next/link";
import { ChevronRight, LogOut, MapPin, Phone, User } from "lucide-react";
import { formatearTelefono } from "@/components/ui/phone-field";
import { useDireccion } from "@/features/onboarding/direccion";
import { useTelefono } from "@/features/onboarding/telefono";
import { cerrarSesion } from "@/features/onboarding/actions";
import { BottomNav } from "./bottom-nav";

export function Perfil() {
  const telefono = useTelefono();
  const direccion = useDireccion();

  const textoDireccion = direccion
    ? `${direccion.texto}${direccion.detalle ? `, ${direccion.detalle}` : ""}`
    : "Sin dirección guardada";

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-sm flex-col gap-4 px-4 pb-20 pt-4">
      <h1 className="font-display text-h2 font-semibold text-ink">Tu perfil</h1>

      <div className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3">
        <div className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
          <User className="size-5" />
        </div>
        <div>
          <p className="text-body font-semibold font-body text-ink">Cliente Pídelo</p>
          <p className="flex items-center gap-1 text-caption font-body text-muted">
            <Phone className="size-3.5" />
            {telefono ? `+57 ${formatearTelefono(telefono)}` : "Sin número registrado"}
          </p>
        </div>
      </div>

      <div className="flex flex-col rounded-lg border border-border bg-surface">
        <Link href="/mapa" className="flex items-center gap-3 p-3 hover:bg-bg">
          <MapPin className="size-4 shrink-0 text-primary" />
          <div className="min-w-0 flex-1">
            <p className="text-body font-semibold font-body text-ink">
              {direccion?.etiqueta ?? "Dirección"}
            </p>
            <p className="truncate text-caption font-body text-muted">{textoDireccion}</p>
          </div>
          <ChevronRight className="size-4 shrink-0 text-muted" />
        </Link>
      </div>

      <form action={cerrarSesion} className="mt-auto pb-4">
        <button
          type="submit"
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-md border border-border bg-surface text-body font-semibold font-body text-error transition-colors duration-300 ease-in-out hover:bg-bg"
        >
          <LogOut className="size-4" />
          Cerrar sesión
        </button>
      </form>

      <BottomNav />
    </div>
  );
}
