"use client";

import { useRef } from "react";

export function OtpInput({
  valor,
  onChange,
  error,
  deshabilitado,
}: {
  valor: string;
  onChange: (valor: string) => void;
  error: boolean;
  deshabilitado: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      className={`relative ${error ? "animate-[sacudida_0.3s_ease-in-out]" : ""}`}
      onClick={() => inputRef.current?.focus()}
    >
      {/* Un solo input invisible captura los dígitos (permite pegar y autocompletar);
          las 4 casillas de abajo solo los muestran. */}
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        aria-label="Código de verificación de 4 dígitos"
        value={valor}
        disabled={deshabilitado}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 4))}
        className="absolute inset-0 z-10 opacity-0"
        autoFocus
      />
      <div className="flex justify-center gap-2">
        {[0, 1, 2, 3].map((i) => {
          const activa = !deshabilitado && valor.length === i;
          return (
            <div
              key={i}
              className={`flex h-14 w-13 items-center justify-center rounded-md border bg-surface font-display text-display font-semibold text-ink transition-colors duration-300 ease-in-out ${
                error
                  ? "border-error"
                  : activa
                    ? "border-primary"
                    : "border-border"
              }`}
            >
              {valor[i] ?? ""}
            </div>
          );
        })}
      </div>
    </div>
  );
}
