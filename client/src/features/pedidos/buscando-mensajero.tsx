import { Bike } from "lucide-react";
import { Rayo } from "@/components/ui/rayo";

// Espera activa: mientras nadie toma el pedido, el cliente ve el radar
// buscando y entiende que la app está trabajando.
export function BuscandoMensajero() {
  return (
    <div className="relative flex flex-col items-center gap-3 overflow-hidden rounded-lg border border-border bg-surface py-8">
      <Rayo className="pointer-events-none absolute -left-3 top-3 size-16 -rotate-12 opacity-10" />
      <Rayo className="pointer-events-none absolute -right-3 bottom-3 size-14 rotate-12 opacity-10" />

      <div className="relative flex size-24 items-center justify-center">
        {/* Ondas del radar */}
        <span className="absolute size-24 rounded-full border-2 border-primary/30 animate-[onda_2.4s_ease-out_infinite]" />
        <span className="absolute size-24 rounded-full border-2 border-primary/30 animate-[onda_2.4s_ease-out_infinite_0.8s]" />
        <span className="absolute size-24 rounded-full border-2 border-primary/30 animate-[onda_2.4s_ease-out_infinite_1.6s]" />
        <span className="relative flex size-14 items-center justify-center rounded-full bg-primary text-white">
          <Bike className="size-7" />
        </span>
      </div>

      <div className="relative text-center">
        <p className="font-display text-h3 font-semibold text-ink">
          Buscando un mensajero
        </p>
        <p className="mt-0.5 text-caption font-body text-muted">
          Avisamos a los que están cerca de ti
        </p>
      </div>

      <div className="relative flex gap-1.5">
        <span className="size-1.5 rounded-full bg-primary animate-[latido_1.2s_ease-in-out_infinite]" />
        <span className="size-1.5 rounded-full bg-primary animate-[latido_1.2s_ease-in-out_infinite_0.2s]" />
        <span className="size-1.5 rounded-full bg-primary animate-[latido_1.2s_ease-in-out_infinite_0.4s]" />
      </div>
    </div>
  );
}
