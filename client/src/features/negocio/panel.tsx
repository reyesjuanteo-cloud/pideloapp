"use client";

import { useState } from "react";
import Link from "next/link";
import { Clock, LogOut, Minus, Package, Plus, Store, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Banner } from "@/components/ui/banner";
import { supabase } from "@/lib/supabase/cliente";
import { usePedidos } from "@/features/pedidos/almacen";
import { useProductos, refrescarProductos } from "@/features/comercios/productos-store";
import { alternarAbierto, useEstadoMiNegocio, refrescarMiNegocio } from "./mi-negocio";

const currency = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

const etiquetaEstado: Record<string, string> = {
  buscando: "Buscando mensajero",
  preparando: "Mensajero en camino a recoger",
  en_camino: "En camino al cliente",
  llegue: "En destino",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

export function PanelNegocio() {
  const { datos: negocio, cargado } = useEstadoMiNegocio();
  const productos = useProductos();
  const pedidos = usePedidos();
  const [nombre, setNombre] = useState("");
  const [precio, setPrecio] = useState("");
  const [aviso, setAviso] = useState<string | null>(null);

  if (!cargado) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <p className="text-body font-body text-muted">Cargando tu negocio…</p>
      </div>
    );
  }

  if (!negocio) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-sm flex-col items-center justify-center gap-3 px-5 text-center">
        <p className="text-body font-semibold font-body text-ink">
          No encontramos tu negocio
        </p>
        <Link
          href="/negocio/registro"
          className="rounded-md bg-primary px-5 py-3 text-body font-semibold font-body text-white"
        >
          Registrar mi negocio
        </Link>
      </div>
    );
  }

  const mios = productos.filter((p) => p.comercioId === negocio.id);
  const misPedidos = pedidos.filter((p) => p.comercio === negocio.nombre);
  const activos = misPedidos.filter(
    (p) => !["entregado", "cancelado"].includes(p.estado)
  );

  async function agregarProducto() {
    const valor = Number(precio);
    if (nombre.trim().length < 2 || !valor || valor < 100) {
      setAviso("Escribe el nombre y un precio válido.");
      return;
    }
    const { error } = await supabase().from("productos").insert({
      comercio_id: negocio!.id,
      nombre: nombre.trim(),
      precio: valor,
    });
    setAviso(error ? "No se pudo agregar el producto." : null);
    setNombre("");
    setPrecio("");
    void refrescarProductos();
  }

  async function quitarProducto(id: string) {
    await supabase().from("productos").delete().eq("id", id);
    void refrescarProductos();
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col gap-4 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate font-display text-h2 font-semibold text-ink">
            {negocio.nombre}
          </h1>
          <p className="text-caption font-body text-muted">
            {negocio.categoria} · {negocio.zona}
            {negocio.direccion ? ` · ${negocio.direccion}` : ""}
          </p>
        </div>
        <form
          action={async () => {
            await supabase().auth.signOut();
            window.location.href = "/ingreso";
          }}
        >
          <button
            type="submit"
            className="flex items-center gap-1 text-caption font-body text-muted hover:text-ink"
          >
            <LogOut className="size-4" />
            Salir
          </button>
        </form>
      </div>

      {negocio.estado === "en_revision" && (
        <Banner tone="advertencia">
          Tu negocio está en revisión. Cuando el equipo lo apruebe aparecerá en la
          app y podrás recibir pedidos. Ve agregando tus productos mientras tanto.
        </Banner>
      )}
      {negocio.estado === "rechazado" && (
        <Banner tone="error">
          Tu registro no fue aprobado. Escríbenos para saber qué corregir.
        </Banner>
      )}

      {/* Abrir / cerrar */}
      {negocio.estado === "aprobado" && (
        <div className="flex items-center justify-between rounded-lg border border-border bg-surface p-3">
          <div>
            <p className="text-body font-semibold font-body text-ink">
              {negocio.abierto ? "Estás recibiendo pedidos" : "Tu negocio está cerrado"}
            </p>
            <p className="text-caption font-body text-muted">
              {negocio.abierto
                ? "Los clientes pueden pedirte ahora."
                : "Nadie puede pedirte hasta que abras."}
            </p>
          </div>
          <button
            onClick={async () => {
              await alternarAbierto(negocio.id, !negocio.abierto);
              void refrescarMiNegocio();
            }}
            className={`shrink-0 rounded-full border px-3 py-2 text-caption font-semibold font-body ${
              negocio.abierto
                ? "border-success bg-success/10 text-success"
                : "border-border bg-surface text-muted"
            }`}
          >
            {negocio.abierto ? "Abierto" : "Cerrado"}
          </button>
        </div>
      )}

      {aviso && <Banner tone="error">{aviso}</Banner>}

      {/* Pedidos que le entran */}
      <h2 className="font-display text-h3 font-semibold text-ink">
        Pedidos de hoy {activos.length > 0 && `· ${activos.length} en curso`}
      </h2>
      {misPedidos.length === 0 ? (
        <p className="rounded-lg border border-border bg-surface p-4 text-body font-body text-muted">
          Aún no te han pedido. Cuando entre un pedido lo verás aquí al instante.
        </p>
      ) : (
        <div className="flex flex-col rounded-lg border border-border bg-surface">
          {[...misPedidos].reverse().map((pedido, i) => (
            <div
              key={pedido.id}
              className={`flex flex-col gap-1 p-3 ${i > 0 ? "border-t border-border" : ""}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-mono text-muted">{pedido.codigo}</span>
                <span className="text-caption font-semibold font-body text-primary">
                  {etiquetaEstado[pedido.estado] ?? pedido.estado}
                </span>
              </div>
              {pedido.items.map((item) => (
                <p key={item.productoId} className="text-body font-body text-ink">
                  {item.cantidad} × {item.nombre}
                </p>
              ))}
              <p className="text-caption font-body text-muted">
                {pedido.horaCreacion} · Total {currency.format(pedido.total)}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Productos */}
      <h2 className="font-display text-h3 font-semibold text-ink">
        Tus productos {mios.length > 0 && `· ${mios.length}`}
      </h2>
      <div className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-3">
        {mios.length === 0 && (
          <p className="text-caption font-body text-muted">
            Sin productos todavía. Agrega el primero para que puedan pedirte.
          </p>
        )}
        {mios.map((p) => (
          <div key={p.id} className="flex items-center gap-2 text-body font-body">
            <Package className="size-4 shrink-0 text-muted" />
            <span className="min-w-0 flex-1 truncate text-ink">{p.nombre}</span>
            <span className="text-muted">{currency.format(p.precio)}</span>
            <button
              onClick={() => quitarProducto(p.id)}
              aria-label={`Eliminar ${p.nombre}`}
              className="text-muted hover:text-error"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        ))}

        <div className="flex items-end gap-2 border-t border-border pt-2">
          <input
            placeholder="Producto nuevo"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="min-h-10 flex-1 rounded-md border border-border bg-bg px-3 text-body font-body text-ink placeholder:text-muted focus:outline-none focus:border-primary"
          />
          <input
            placeholder="$"
            inputMode="numeric"
            value={precio}
            onChange={(e) => setPrecio(e.target.value.replace(/\D/g, "").slice(0, 7))}
            className="min-h-10 w-24 rounded-md border border-border bg-bg px-3 text-body font-body text-ink placeholder:text-muted focus:outline-none focus:border-primary"
          />
          <button
            onClick={agregarProducto}
            aria-label="Agregar producto"
            className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary text-white"
          >
            <Plus className="size-4" />
          </button>
        </div>
      </div>

      <p className="flex items-center gap-1.5 text-caption font-body text-muted">
        <Clock className="size-3.5" />
        Tus clientes ven un tiempo estimado de {negocio.tiempoMin}–{negocio.tiempoMax} min.
      </p>
    </div>
  );
}
