"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronRight, LogOut, MapPin, Phone, ScrollText, Trash2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Banner } from "@/components/ui/banner";
import { supabase } from "@/lib/supabase/cliente";
import { eliminarMiCuenta } from "@/features/onboarding/eliminar-cuenta";
import { formatearTelefono } from "@/components/ui/phone-field";
import { useDireccion } from "@/features/onboarding/direccion";
import { useTelefono } from "@/features/onboarding/telefono";
import { cerrarSesion } from "@/features/onboarding/actions";
import { BottomNav } from "./bottom-nav";

export function Perfil() {
  const [confirmando, setConfirmando] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

      <Link
        href="/legal"
        className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3 hover:bg-bg"
      >
        <ScrollText className="size-4 shrink-0 text-primary" />
        <span className="min-w-0 flex-1">
          <span className="block text-body font-semibold font-body text-ink">
            Términos y privacidad
          </span>
          <span className="block text-caption font-body text-muted">
            Cómo funciona Pídelo y qué hacemos con tus datos
          </span>
        </span>
        <ChevronRight className="size-4 shrink-0 text-muted" />
      </Link>

      <div className="mt-auto flex flex-col gap-3 pb-4">
        <form action={cerrarSesion}>
          <button
            type="submit"
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-md border border-border bg-surface text-body font-semibold font-body text-ink transition-colors duration-300 ease-in-out hover:bg-bg"
          >
            <LogOut className="size-4" />
            Cerrar sesión
          </button>
        </form>

        {error && <Banner tone="error">{error}</Banner>}

        {confirmando ? (
          <div className="flex flex-col gap-2 rounded-lg border border-error bg-error/5 p-3">
            <p className="text-body font-semibold font-body text-ink">
              ¿Seguro que quieres eliminar tu cuenta?
            </p>
            <p className="text-caption font-body text-muted">
              Se borran tu perfil, tus direcciones y tus mensajes. Tu historial de
              pedidos se conserva sin tus datos personales, como exige la ley
              contable. Esto no se puede deshacer.
            </p>
            <div className="flex gap-2">
              <Button
                fullWidth
                pending={eliminando}
                className="bg-error hover:bg-error"
                onClick={async () => {
                  setEliminando(true);
                  setError(null);
                  const r = await eliminarMiCuenta();
                  if (!r.ok) {
                    setError(r.error ?? "No se pudo eliminar la cuenta.");
                    setEliminando(false);
                    return;
                  }
                  await supabase().auth.signOut();
                  window.location.href = "/bienvenida";
                }}
              >
                Sí, eliminar
              </Button>
              <Button fullWidth variant="secondary" onClick={() => setConfirmando(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setConfirmando(true)}
            className="flex min-h-12 w-full items-center justify-center gap-2 text-body font-body text-error hover:underline"
          >
            <Trash2 className="size-4" />
            Eliminar mi cuenta
          </button>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
