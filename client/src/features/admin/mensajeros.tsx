"use client";

import { Bike, CheckCircle2, Clock, ShieldCheck, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { crearRecursoRemoto } from "@/lib/recurso-remoto";
import type { EstadoMensajero } from "@/features/mensajero/tipos";
import {
  cambiarEstadoMensajero,
  listarMensajeros,
  type MensajeroAdmin,
} from "./acciones";
import { leerClaveAdmin } from "./gate";

// Lista real de aspirantes desde Supabase (vía server action con la clave).
const recurso = crearRecursoRemoto<MensajeroAdmin[]>([], () =>
  listarMensajeros(leerClaveAdmin())
);

export const refrescarMensajerosAdmin = recurso.refrescar;

export function useMensajerosAdmin(): MensajeroAdmin[] {
  return recurso.useRecurso();
}

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
  const mensajeros = useMensajerosAdmin();

  async function cambiar(id: string, estado: EstadoMensajero) {
    await cambiarEstadoMensajero(leerClaveAdmin(), id, estado);
    void recurso.refrescar();
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col gap-4 p-4">
      <div className="flex items-center gap-2">
        <ShieldCheck className="size-5 text-primary" />
        <h1 className="font-display text-h2 font-semibold text-ink">
          Mensajeros — aprobación
        </h1>
      </div>

      {mensajeros.length === 0 ? (
        <p className="rounded-lg border border-border bg-surface p-4 text-body font-body text-muted">
          No hay registros de mensajeros todavía.
        </p>
      ) : (
        mensajeros.map((perfil) => (
          <div
            key={perfil.id}
            className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-body font-semibold font-body text-ink">{perfil.nombre}</p>
                <p className="text-caption font-body text-muted">
                  CC {perfil.documento} · +57 {perfil.celular}
                </p>
                <p className="truncate text-caption font-body text-muted">
                  {perfil.correo} ·{" "}
                  {perfil.municipio === "Todos" ? "Los tres municipios" : perfil.municipio}
                </p>
                <p className="flex items-center gap-1 text-caption font-body text-muted">
                  <Bike className="size-3.5" />
                  {perfil.vehiculo === "moto" ? `Moto · Placa ${perfil.placa}` : "Bicicleta"}
                  {" · "}Registrado {perfil.fechaRegistro} · Saldo $
                  {perfil.saldo.toLocaleString("es-CO")}
                </p>
              </div>
              <span
                className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-caption font-semibold font-body ${badge[perfil.estado].clase}`}
              >
                {badge[perfil.estado].icono}
                {badge[perfil.estado].texto}
              </span>
            </div>

            {/* Documentos del aspirante (URLs firmadas, abren en pestaña nueva) */}
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["cedula", "Cédula"],
                  ["rostro", "Rostro en vivo"],
                ] as const
              ).map(([nombre, etiqueta]) =>
                perfil.fotos[nombre] ? (
                  <a
                    key={nombre}
                    href={perfil.fotos[nombre]!}
                    target="_blank"
                    rel="noreferrer"
                    className="flex flex-col items-center gap-1"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- URL firmada temporal de Storage */}
                    <img
                      src={perfil.fotos[nombre]!}
                      alt={etiqueta}
                      className="size-16 rounded-md border border-border object-cover"
                    />
                    <span className="text-caption font-body text-muted">{etiqueta}</span>
                  </a>
                ) : (
                  <div key={nombre} className="flex flex-col items-center gap-1 opacity-40">
                    <div className="flex size-16 items-center justify-center rounded-md border border-dashed border-border text-caption font-body text-muted">
                      Sin foto
                    </div>
                    <span className="text-caption font-body text-muted">{etiqueta}</span>
                  </div>
                )
              )}
            </div>

            {/* Puntajes de la verificación facial en el dispositivo */}
            {perfil.verificacion ? (
              <div className="flex flex-wrap gap-2 text-caption font-semibold font-body">
                {(
                  [
                    ["Similitud con cédula", perfil.verificacion.similitud, 0.5, 0.35],
                    ["Anti-spoofing", perfil.verificacion.antispoof, 0.7, 0.5],
                    ["Vivacidad", perfil.verificacion.vivacidad, 0.7, 0.5],
                  ] as const
                ).map(([etiqueta, valor, bueno, medio]) => (
                  <span
                    key={etiqueta}
                    className={`rounded-full px-2.5 py-1 ${
                      valor === null
                        ? "bg-bg text-muted"
                        : valor >= bueno
                          ? "bg-success/10 text-success"
                          : valor >= medio
                            ? "bg-accent/10 text-accent-deep"
                            : "bg-error/10 text-error"
                    }`}
                  >
                    {etiqueta}: {valor === null ? "—" : `${Math.round(valor * 100)}%`}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-caption font-body text-muted">
                Sin verificación facial registrada.
              </p>
            )}


            {perfil.estado === "en_revision" ? (
              <div className="flex gap-2">
                <Button fullWidth onClick={() => cambiar(perfil.id, "aprobado")}>
                  Aprobar
                </Button>
                <Button
                  fullWidth
                  variant="secondary"
                  className="text-error"
                  onClick={() => cambiar(perfil.id, "rechazado")}
                >
                  Rechazar
                </Button>
              </div>
            ) : (
              <Button
                fullWidth
                variant="secondary"
                onClick={() => cambiar(perfil.id, "en_revision")}
              >
                Volver a revisión
              </Button>
            )}
          </div>
        ))
      )}
    </div>
  );
}
