"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Plus, Store, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Chip } from "@/components/ui/chip";
import { refrescarComercios, useComercios } from "@/features/comercios/store";
import { refrescarProductos, useProductos } from "@/features/comercios/productos-store";
import {
  alternarComercio,
  crearComercio,
  crearProducto,
  eliminarComercio,
  eliminarProducto,
} from "./acciones";
import { leerClaveAdmin } from "./gate";

const currency = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

const categorias = ["Comida", "Mercado", "Farmacia", "Panadería"];
const zonas = ["Centro, Girardot", "Girardot", "Ricaurte", "Flandes"];

function FormularioNuevoComercio({ alCrear }: { alCrear: () => void }) {
  const [nombre, setNombre] = useState("");
  const [categoria, setCategoria] = useState("Comida");
  const [zona, setZona] = useState("Centro, Girardot");
  const [error, setError] = useState<string | undefined>();

  async function crear() {
    if (nombre.trim().length < 3) {
      setError("Escribe el nombre del comercio.");
      return;
    }
    await crearComercio(leerClaveAdmin(), {
      nombre: nombre.trim(),
      categoria,
      zona,
    });
    void refrescarComercios();
    setNombre("");
    alCrear();
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-3">
      <Input
        label="Nombre del comercio"
        name="nombre-comercio"
        placeholder="Restaurante Doña Marta"
        value={nombre}
        onChange={(e) => {
          setNombre(e.target.value);
          setError(undefined);
        }}
        error={error}
      />
      <div className="flex flex-wrap gap-2">
        {categorias.map((c) => (
          <Chip key={c} active={categoria === c} onClick={() => setCategoria(c)}>
            {c}
          </Chip>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {zonas.map((z) => (
          <Chip key={z} active={zona === z} onClick={() => setZona(z)}>
            {z}
          </Chip>
        ))}
      </div>
      <Button fullWidth onClick={crear}>
        Crear comercio
      </Button>
    </div>
  );
}

function ProductosDeComercio({ comercioId }: { comercioId: string }) {
  const productos = useProductos().filter((p) => p.comercioId === comercioId);
  const [nombre, setNombre] = useState("");
  const [precio, setPrecio] = useState("");

  async function agregar() {
    const valor = Number(precio);
    if (nombre.trim().length < 2 || !valor || valor < 100) return;
    await crearProducto(leerClaveAdmin(), {
      comercioId,
      nombre: nombre.trim(),
      precio: valor,
    });
    void refrescarProductos();
    setNombre("");
    setPrecio("");
  }

  return (
    <div className="flex flex-col gap-2 border-t border-border pt-2">
      {productos.length === 0 && (
        <p className="text-caption font-body text-muted">
          Sin productos. Agrega el primero para que los clientes puedan pedir.
        </p>
      )}
      {productos.map((p) => (
        <div key={p.id} className="flex items-center gap-2 text-body font-body">
          <span className="flex-1 truncate text-ink">{p.nombre}</span>
          <span className="text-muted">{currency.format(p.precio)}</span>
          <button
            onClick={async () => {
              await eliminarProducto(leerClaveAdmin(), p.id);
              void refrescarProductos();
            }}
            aria-label={`Eliminar ${p.nombre}`}
            className="text-muted transition-colors duration-300 ease-in-out hover:text-error"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      ))}
      <div className="flex items-end gap-2">
        <input
          placeholder="Producto nuevo"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="min-h-10 flex-1 rounded-md border border-border bg-surface px-3 text-body font-body text-ink placeholder:text-muted focus:outline-none focus:border-primary"
        />
        <input
          placeholder="$"
          inputMode="numeric"
          value={precio}
          onChange={(e) => setPrecio(e.target.value.replace(/\D/g, "").slice(0, 7))}
          className="min-h-10 w-24 rounded-md border border-border bg-surface px-3 text-body font-body text-ink placeholder:text-muted focus:outline-none focus:border-primary"
        />
        <button
          onClick={agregar}
          aria-label="Agregar producto"
          className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary text-white transition-colors duration-300 ease-in-out hover:bg-primary-dark"
        >
          <Plus className="size-4" />
        </button>
      </div>
    </div>
  );
}

export function AdminComercios() {
  const comercios = useComercios();
  const [mostrandoNuevo, setMostrandoNuevo] = useState(false);
  const [abiertoId, setAbiertoId] = useState<string | null>(null);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Store className="size-5 text-primary" />
          <h1 className="font-display text-h2 font-semibold text-ink">Comercios</h1>
        </div>
        <Button variant="accent" onClick={() => setMostrandoNuevo((v) => !v)}>
          {mostrandoNuevo ? "Cerrar" : "Nuevo comercio"}
        </Button>
      </div>

      {mostrandoNuevo && <FormularioNuevoComercio alCrear={() => setMostrandoNuevo(false)} />}

      <div className="flex flex-col gap-3">
        {comercios.map((comercio) => {
          const expandido = abiertoId === comercio.id;
          return (
            <div
              key={comercio.id}
              className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-3"
            >
              <div className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-body font-semibold font-body text-ink">
                    {comercio.nombre}
                  </p>
                  <p className="text-caption font-body text-muted">
                    {comercio.categoria} · {comercio.zona}
                  </p>
                </div>
                <button
                  onClick={async () => {
                    await alternarComercio(leerClaveAdmin(), comercio.id, !comercio.abierto);
                    void refrescarComercios();
                  }}
                  className={`rounded-full border px-2.5 py-1 text-caption font-semibold font-body transition-colors duration-300 ease-in-out ${
                    comercio.abierto
                      ? "border-success bg-success/10 text-success"
                      : "border-border bg-surface text-muted"
                  }`}
                >
                  {comercio.abierto ? "Abierto" : "Cerrado"}
                </button>
                <button
                  onClick={async () => {
                    await eliminarComercio(leerClaveAdmin(), comercio.id);
                    void refrescarComercios();
                  }}
                  aria-label={`Eliminar ${comercio.nombre}`}
                  className="text-muted transition-colors duration-300 ease-in-out hover:text-error"
                >
                  <Trash2 className="size-4" />
                </button>
                <button
                  onClick={() => setAbiertoId(expandido ? null : comercio.id)}
                  aria-label="Ver productos"
                  className="text-muted hover:text-ink"
                >
                  {expandido ? (
                    <ChevronUp className="size-4" />
                  ) : (
                    <ChevronDown className="size-4" />
                  )}
                </button>
              </div>
              {expandido && <ProductosDeComercio comercioId={comercio.id} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
