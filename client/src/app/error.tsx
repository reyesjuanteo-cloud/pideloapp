"use client";

// Pantalla de error global: si algo revienta, la persona ve la marca y una
// salida, no la pantalla técnica de Next.
import { RefreshCw, House } from "lucide-react";
import { Rayo } from "@/components/ui/rayo";

export default function ErrorGlobal({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-sm flex-col items-center justify-center gap-4 px-6 text-center">
      <Rayo className="size-14 opacity-30" />
      <h1 className="font-display text-h1 font-bold text-ink">Algo salió mal</h1>
      <p className="text-body font-body text-muted">
        No fue tu culpa. Inténtalo de nuevo y, si sigue fallando, cierra la app y
        vuelve a abrirla.
      </p>
      <button
        onClick={reset}
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-primary text-body font-semibold font-body text-white transition-colors duration-300 ease-in-out hover:bg-primary-dark"
      >
        <RefreshCw className="size-4" />
        Intentar de nuevo
      </button>
      <a
        href="/home"
        className="flex items-center gap-1.5 text-body font-body text-primary hover:text-primary-dark"
      >
        <House className="size-4" />
        Ir al inicio
      </a>
    </div>
  );
}
