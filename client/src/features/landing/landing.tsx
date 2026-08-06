import Image from "next/image";
import Link from "next/link";

// Pantalla de bienvenida: fondo blanco con puntos naranjas, el logo como
// protagonista, y solo las dos acciones.
export function Landing() {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-surface">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-25 [background-image:radial-gradient(var(--color-accent)_1.5px,transparent_1.5px)] [background-size:18px_18px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-20 -right-20 size-64 rounded-full bg-accent/15 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 -left-20 size-56 rounded-full bg-primary/10 blur-3xl"
      />

      <div className="relative mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center px-6 text-center">
        <Image src="/marca-p.png" alt="PideloApp" width={170} height={170} priority />
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
          className="rounded-md border border-border bg-surface py-3.5 text-center text-body font-body font-semibold text-ink transition-colors duration-300 ease-in-out hover:bg-bg"
        >
          Iniciar sesión
        </Link>
      </div>
    </div>
  );
}
