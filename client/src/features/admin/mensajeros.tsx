"use client";

import { Bike, CheckCircle2, Clock, ShieldCheck, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cambiarEstadoMensajero, usePerfilMensajero } from "@/features/mensajero/perfil";
import type { EstadoMensajero } from "@/features/mensajero/tipos";

// ⚠️ TEMPORAL: panel mínimo de aprobación. Hoy solo ve el registro guardado en
// este navegador; con Supabase listará todos los mensajeros registrados.

const badge: Record<EstadoMensajero, { texto: string; clase: string; icono: React.ReactNode }> = {
  en_revision: {
    texto: "En revisión",
    clase: "bg-accent/10 text-accent-deep",
    icono: <Clock className="size-3.5" />,
  },
  aprobado: {
    texto: "Aprobado",
    clase: "bg-success/10 text-success",
    icono: <CheckCircle2 className="size-3.5" />,
  },
  rechazado: {
    texto: "Rechazado",
    clase: "bg-error/10 text-error",
    icono: <XCircle className="size-3.5" />,
  },
};

export function AdminMensajeros() {
  const perfil = usePerfilMensajero();

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col gap-4 p-4">
      <div className="flex items-center gap-2">
        <ShieldCheck className="size-5 text-primary" />
        <h1 className="font-display text-h2 font-semibold text-ink">
          Mensajeros — aprobación
        </h1>
      </div>
      <p className="text-caption font-body text-muted">
        Panel del equipo Pídelo. Por ahora muestra el registro de este navegador; con la
        base de datos listará todos los aspirantes.
      </p>

      {!perfil ? (
        <p className="rounded-lg border border-border bg-surface p-4 text-body font-body text-muted">
          No hay registros de mensajeros todavía.
        </p>
      ) : (
        <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-body font-semibold font-body text-ink">{perfil.nombre}</p>
              <p className="text-caption font-body text-muted">
                CC {perfil.documento} · +57 {perfil.celular} · {perfil.municipio}
              </p>
              <p className="flex items-center gap-1 text-caption font-body text-muted">
                <Bike className="size-3.5" />
                {perfil.vehiculo === "moto"
                  ? `Moto ${perfil.placa} · Lic. ${perfil.licencia} · SOAT ${perfil.soatVigente ? "declarado" : "sin declarar"}`
                  : "Bicicleta"}
                {" · "}Registrado {perfil.fechaRegistro}
              </p>
            </div>
            <span
              className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-caption font-semibold font-body ${badge[perfil.estado].clase}`}
            >
              {badge[perfil.estado].icono}
              {badge[perfil.estado].texto}
            </span>
          </div>

          {perfil.estado === "en_revision" && (
            <div className="flex gap-2">
              <Button fullWidth onClick={() => cambiarEstadoMensajero("aprobado")}>
                Aprobar
              </Button>
              <Button
                fullWidth
                variant="secondary"
                className="text-error"
                onClick={() => cambiarEstadoMensajero("rechazado")}
              >
                Rechazar
              </Button>
            </div>
          )}
          {perfil.estado !== "en_revision" && (
            <Button
              fullWidth
              variant="secondary"
              onClick={() => cambiarEstadoMensajero("en_revision")}
            >
              Volver a revisión
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
