"use client";

import { useState } from "react";
import { ShieldAlert, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { crearRecursoRemoto } from "@/lib/recurso-remoto";
import {
  cambiarEstadoProveedor,
  guardarComisionServicios,
  leerConfigServicios,
  listarProveedores,
  type ConfigServicios,
  type ProveedorAdmin,
} from "./acciones";
import { leerClaveAdmin } from "./gate";

const currency = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

const recursoProveedores = crearRecursoRemoto<ProveedorAdmin[]>([], () =>
  listarProveedores(leerClaveAdmin())
);
const recursoConfig = crearRecursoRemoto<ConfigServicios | null>(null, () =>
  leerConfigServicios(leerClaveAdmin())
);

const etiquetaEstado: Record<ProveedorAdmin["estado"], string> = {
  en_revision: "En revisión",
  aprobado: "Aprobado",
  rechazado: "Rechazado",
  suspendido: "Suspendido",
};

export function AdminServicios() {
  const proveedores = recursoProveedores.useRecurso();
  const config = recursoConfig.useRecurso();
  const [pct, setPct] = useState("");
  const [guardado, setGuardado] = useState(false);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col gap-4 p-4">
      <div className="flex items-center gap-2">
        <Wrench className="size-5 text-primary" />
        <h1 className="font-display text-h2 font-semibold text-ink">Servicios</h1>
      </div>

      {/* Comisión y números */}
      {config && (
        <div className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-3">
          <p className="text-body font-body text-muted">
            {config.solicitudes} solicitudes · {config.completadas} completadas ·{" "}
            <span className="font-semibold text-ink">
              {currency.format(config.comisiones)} en comisiones
            </span>
          </p>
          <div className="flex items-end gap-2">
            <label className="flex flex-1 flex-col gap-1 text-caption font-body text-muted">
              Comisión de Pídelo (%) — hoy: {config.comisionPct}%
              <input
                inputMode="numeric"
                placeholder={String(config.comisionPct)}
                value={pct}
                onChange={(e) => {
                  setPct(e.target.value.replace(/\D/g, "").slice(0, 2));
                  setGuardado(false);
                }}
                className="min-h-10 rounded-md border border-border bg-bg px-3 text-body font-body text-ink focus:outline-none focus:border-primary"
              />
            </label>
            <Button
              onClick={async () => {
                const valor = Number(pct);
                if (!pct || valor > 30) return;
                const r = await guardarComisionServicios(leerClaveAdmin(), valor);
                if (r.ok) {
                  setGuardado(true);
                  setPct("");
                  void recursoConfig.refrescar();
                }
              }}
            >
              Guardar
            </Button>
          </div>
          {guardado && (
            <p className="text-caption font-body text-success">
              Comisión actualizada. Aplica a las contrataciones desde ahora.
            </p>
          )}
        </div>
      )}

      {/* Proveedores */}
      <h2 className="font-display text-h3 font-semibold text-ink">
        Proveedores {proveedores.length > 0 && `· ${proveedores.length}`}
      </h2>
      {proveedores.length === 0 && (
        <p className="rounded-lg border border-border bg-surface p-4 text-body font-body text-muted">
          Nadie se ha registrado todavía como proveedor de servicios.
        </p>
      )}
      {proveedores.map((p) => (
        <div
          key={p.id}
          className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-3"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="min-w-0 truncate text-body font-semibold font-body text-ink">
              {p.nombre}
            </p>
            <span
              className={`shrink-0 rounded-full px-2.5 py-1 text-caption font-semibold font-body ${
                p.estado === "aprobado"
                  ? "bg-success/10 text-success"
                  : p.estado === "en_revision"
                    ? "bg-accent/10 text-accent-deep"
                    : "bg-error/10 text-error"
              }`}
            >
              {etiquetaEstado[p.estado]}
            </span>
          </div>
          <p className="text-caption font-body text-muted">
            CC {p.documento} · {p.celular} · {p.municipio} · desde {p.registradoEn}
          </p>
          <p className="text-caption font-body text-muted">
            {p.categorias.join(", ") || "Sin categorías"} · {p.serviciosCompletados}{" "}
            completados
          </p>
          {p.descripcion && (
            <p className="text-body font-body text-muted">“{p.descripcion}”</p>
          )}
          {p.intentosContacto > 0 && (
            <p className="flex items-center gap-1.5 rounded-md bg-error/5 p-2 text-caption font-body text-error">
              <ShieldAlert className="size-3.5 shrink-0" />
              {p.intentosContacto}{" "}
              {p.intentosContacto === 1
                ? "intento de compartir contacto"
                : "intentos de compartir contacto"}{" "}
              por fuera de la app
            </p>
          )}

          <div className="flex gap-2 border-t border-border pt-2">
            {p.estado === "en_revision" && (
              <>
                <Button
                  fullWidth
                  onClick={async () => {
                    await cambiarEstadoProveedor(leerClaveAdmin(), p.id, "aprobado");
                    void recursoProveedores.refrescar();
                  }}
                >
                  Aprobar
                </Button>
                <Button
                  fullWidth
                  variant="secondary"
                  className="text-error"
                  onClick={async () => {
                    await cambiarEstadoProveedor(leerClaveAdmin(), p.id, "rechazado");
                    void recursoProveedores.refrescar();
                  }}
                >
                  Rechazar
                </Button>
              </>
            )}
            {p.estado === "aprobado" && (
              <Button
                fullWidth
                variant="secondary"
                className="text-error"
                onClick={async () => {
                  await cambiarEstadoProveedor(leerClaveAdmin(), p.id, "suspendido");
                  void recursoProveedores.refrescar();
                }}
              >
                Suspender
              </Button>
            )}
            {(p.estado === "suspendido" || p.estado === "rechazado") && (
              <Button
                fullWidth
                onClick={async () => {
                  await cambiarEstadoProveedor(leerClaveAdmin(), p.id, "aprobado");
                  void recursoProveedores.refrescar();
                }}
              >
                Reactivar
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
