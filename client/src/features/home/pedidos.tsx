import Link from "next/link";
import { Receipt } from "lucide-react";
import { BottomNav } from "./bottom-nav";

export function Pedidos() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-sm flex-col gap-4 px-4 pb-20 pt-4">
      <h1 className="font-display text-h2 font-semibold text-ink">Tus pedidos</h1>

      {/* Sin pedidos reales todavía — se llenará desde Supabase cuando exista la tabla. */}
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
          <Receipt className="size-7 text-primary" />
        </div>
        <p className="text-body font-semibold font-body text-ink">
          Aún no has hecho pedidos
        </p>
        <p className="max-w-[30ch] text-caption font-body text-muted">
          Cuando hagas tu primer pedido, aquí verás su estado y tu historial.
        </p>
        <Link
          href="/home"
          className="mt-2 rounded-md bg-primary px-5 py-3 text-body font-semibold font-body text-white transition-colors duration-300 ease-in-out hover:bg-primary-dark"
        >
          Hacer mi primer pedido
        </Link>
      </div>

      <BottomNav />
    </div>
  );
}
