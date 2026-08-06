import Image from "next/image";
import Link from "next/link";
import { Rayo } from "@/components/ui/rayo";

// Bienvenida: fondo completamente blanco, el logo como protagonista y
// rayos de la marca como único detalle decorativo.
export function Landing() {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-white">
      <Rayo className="absolute -left-4 top-16 size-24 -rotate-12 opacity-10" />
      <Rayo className="absolute right-6 top-32 size-8 rotate-12 opacity-25" />
      <Rayo className="absolute -right-6 bottom-48 size-20 rotate-6 opacity-10" />
      <Rayo className="absolute left-8 bottom-40 size-5 -rotate-6 opacity-30" />

      <div className="relative mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center px-6 text-center">
        <Image src="/marca-p.png" alt="PideloApp" width={180} height={180} priority />
        <p className="mt-2 font-display text-display font-bold tracking-tight text-primary">
          PideloApp
        </p>
        <h1 className="mt-6 max-w-[16ch] font-display text-[32px] font-bold leading-tight text-ink">
          Pide ahora, recíbelo en minutos
        </h1>
        <p className="mt-3 text-body font-body text-muted">
          Comida, mercado, farmacia o lo que sea — en Girardot, Ricaurte y Flandes.
        </p>
      </div>

      <div className="relative mx-auto flex w-full max-w-sm flex-col gap-3 px-6 pb-10">
        <Link
          href="/ubicacion"
          className="rounded-md bg-primary py-3.5 text-center text-body font-body font-semibold text-white shadow-[0_10px_25px_rgba(232,56,13,0.28)] transition-transform duration-300 ease-in-out hover:-translate-y-0.5"
        >
          Crear cuenta
        </Link>
        <Link
          href="/ingreso"
          className="rounded-md border border-border bg-white py-3.5 text-center text-body font-body font-semibold text-ink transition-colors duration-300 ease-in-out hover:bg-bg"
        >
          Iniciar sesión
        </Link>
      </div>
    </div>
  );
}
