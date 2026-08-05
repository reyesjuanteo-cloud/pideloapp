import { Home, Receipt, Search, User } from "lucide-react";

const items = [
  { icono: Home, label: "Inicio", activo: true },
  { icono: Search, label: "Buscar", activo: false },
  { icono: Receipt, label: "Pedidos", activo: false },
  { icono: User, label: "Perfil", activo: false },
];

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface">
      <div className="mx-auto flex w-full max-w-sm">
        {items.map(({ icono: Icono, label, activo }) => (
          <button
            key={label}
            aria-label={label}
            aria-current={activo ? "page" : undefined}
            className={`flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 font-body transition-colors duration-300 ease-in-out ${
              activo ? "text-primary" : "text-muted hover:text-ink"
            }`}
          >
            <Icono className="size-4.5" />
            <span className="text-[10px]">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
