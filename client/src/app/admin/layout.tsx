"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { GateAdmin } from "@/features/admin/gate";

const secciones = [
  { href: "/admin", label: "Resumen" },
  { href: "/admin/comercios", label: "Comercios" },
  { href: "/admin/mensajeros", label: "Mensajeros" },
  { href: "/admin/pedidos", label: "Pedidos" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <GateAdmin>
      <div className="mx-auto w-full max-w-lg px-4 pt-4">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {secciones.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-caption font-semibold font-body transition-colors duration-300 ease-in-out ${
                pathname === href
                  ? "border-primary bg-primary text-white"
                  : "border-border bg-surface text-muted hover:text-ink"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
      {children}
    </GateAdmin>
  );
}
