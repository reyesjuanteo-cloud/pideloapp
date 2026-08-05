"use client";

import { ChevronDown } from "lucide-react";

// Formatea "3001234567" → "300 123 4567" mientras se escribe.
export function formatearTelefono(digitos: string): string {
  const d = digitos.slice(0, 10);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`;
  return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
}

export function telefonoValido(digitos: string): boolean {
  return digitos.length === 10 && digitos.startsWith("3");
}

export function PhoneField({
  digitos,
  onChange,
  error,
}: {
  digitos: string;
  onChange: (digitos: string) => void;
  error?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor="telefono"
        className="text-label font-semibold uppercase tracking-wide text-muted font-body"
      >
        Celular
      </label>
      <div className="flex">
        <button
          type="button"
          title="Cambiar país"
          className="flex items-center gap-1 rounded-l-md border border-r-0 border-border bg-surface px-3 text-body font-body text-ink"
        >
          {/* Única excepción de emoji permitida: la bandera del selector de país */}
          <span aria-hidden>🇨🇴</span>
          +57
          <ChevronDown className="size-3.5 text-muted" />
        </button>
        <input
          id="telefono"
          name="telefono"
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          placeholder="300 123 4567"
          value={formatearTelefono(digitos)}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 10))}
          className={`min-h-11 w-full rounded-r-md border bg-surface px-3 py-2.5 text-body font-body text-ink placeholder:text-muted transition-colors duration-300 ease-in-out focus:outline-none focus:border-primary ${
            error ? "border-error" : "border-border"
          }`}
        />
      </div>
      {error && <p className="text-caption text-error font-body">{error}</p>}
    </div>
  );
}
