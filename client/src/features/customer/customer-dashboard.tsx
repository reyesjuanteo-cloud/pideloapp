"use client";

import { useEffect, useRef, useState } from "react";
import { LogOut, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { logout } from "@/features/auth/actions";
import { categorias, mockComercios } from "./mock-comercios";
import { ComercioCard } from "./comercio-card";
import { PedidoTracker } from "./pedido-tracker";
import type { PedidoActivo } from "./types";

export function CustomerDashboard() {
  const [busqueda, setBusqueda] = useState("");
  const [categoria, setCategoria] = useState("Todos");
  const [pedido, setPedido] = useState<PedidoActivo | null>(null);
  const contadorPedidos = useRef(5000);
  const timeouts = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const pendientes = timeouts.current;
    return () => pendientes.forEach(clearTimeout);
  }, []);

  function pedir(comercio: string) {
    contadorPedidos.current += 1;
    const codigo = `PD-${contadorPedidos.current}`;
    setPedido({ codigo, comercio, estado: "preparando" });

    // Simulación del avance del pedido — reemplazar por estado real desde Supabase.
    timeouts.current.push(
      setTimeout(() => setPedido((p) => (p && { ...p, estado: "en_camino" })), 5000),
      setTimeout(() => setPedido((p) => (p && { ...p, estado: "entregado" })), 12000)
    );
  }

  const buscando = busqueda.trim().length >= 3;

  const comerciosFiltrados = mockComercios.filter((c) => {
    if (buscando) {
      const q = busqueda.trim().toLowerCase();
      return c.nombre.toLowerCase().includes(q) || c.categoria.toLowerCase().includes(q);
    }
    return categoria === "Todos" || c.categoria === categoria;
  });

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-h2 font-semibold text-ink">
          ¿Qué vas a pedir hoy?
        </h1>
        <form action={logout}>
          <button
            type="submit"
            title="Cerrar sesión"
            className="flex items-center gap-1 text-caption font-body text-muted transition-colors duration-300 ease-in-out hover:text-ink"
          >
            <LogOut className="size-4" />
            Salir
          </button>
        </form>
      </div>

      {pedido && <PedidoTracker pedido={pedido} />}

      <div className="flex flex-col gap-1.5">
        <Input
          label="Buscar"
          name="busqueda"
          placeholder="Busca un comercio..."
          icon={<Search className="size-4" />}
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        {buscando && (
          <p className="text-caption font-body text-muted">
            Buscando &quot;{busqueda.trim()}&quot; en todas las categorías
          </p>
        )}
      </div>

      <div
        className={`flex flex-wrap gap-2 transition-opacity duration-300 ease-in-out ${
          buscando ? "pointer-events-none opacity-40" : ""
        }`}
      >
        {categorias.map((c) => (
          <button
            key={c}
            onClick={() => setCategoria(c)}
            disabled={buscando}
            className={`rounded-full border px-3 py-1.5 text-caption font-semibold font-body transition-colors duration-300 ease-in-out ${
              categoria === c
                ? "border-primary bg-primary text-white"
                : "border-border bg-surface text-muted hover:text-ink"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <h2 className="font-display text-h3 font-semibold text-ink">
        Comercios de tu zona
      </h2>

      {comerciosFiltrados.length === 0 ? (
        <p className="rounded-lg border border-border bg-surface p-4 text-body font-body text-muted">
          No encontramos comercios con ese filtro.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {comerciosFiltrados.map((comercio) => (
            <ComercioCard
              key={comercio.id}
              comercio={comercio}
              deshabilitado={pedido !== null && pedido.estado !== "entregado"}
              onPedir={() => pedir(comercio.nombre)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
