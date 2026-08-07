"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, IdCard, Lock, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Chip } from "@/components/ui/chip";
import { PhoneField, telefonoValido } from "@/components/ui/phone-field";
import {
  SelectorUbicacion,
  type UbicacionElegida,
} from "@/components/ui/selector-ubicacion";
import { supabase } from "@/lib/supabase/cliente";
import { correoInternoProveedor, crearCuentaProveedor } from "./cuenta";
import { refrescarMiProveedor, useCategoriasServicio } from "./datos";

const municipios = ["Girardot", "Ricaurte", "Flandes"];

export function RegistroProveedor() {
  const router = useRouter();
  const categorias = useCategoriasServicio();
  const [nombre, setNombre] = useState("");
  const [cedula, setCedula] = useState("");
  const [celular, setCelular] = useState("");
  const [municipio, setMunicipio] = useState("Girardot");
  const [elegidas, setElegidas] = useState<string[]>([]);
  const [descripcion, setDescripcion] = useState("");
  const [ubicacion, setUbicacion] = useState<UbicacionElegida | null>(null);
  const [clave, setClave] = useState("");
  const [clave2, setClave2] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [errores, setErrores] = useState<Record<string, string>>({});

  function alternarCategoria(id: string) {
    setElegidas((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  }

  async function enviar() {
    const e: Record<string, string> = {};
    if (nombre.trim().length < 3) e.nombre = "Escribe tu nombre completo.";
    if (!/^\d{6,15}$/.test(cedula)) e.cedula = "Cédula sin puntos ni guiones.";
    if (!telefonoValido(celular)) e.celular = "Celular de 10 dígitos que empiece por 3.";
    if (elegidas.length === 0) e.categorias = "Elige al menos un servicio que ofreces.";
    if (descripcion.trim().length < 10)
      e.descripcion = "Cuéntanos qué haces y tu experiencia (mínimo 10 letras).";
    if (clave.length < 6) e.clave = "Crea una clave de al menos 6 caracteres.";
    else if (clave !== clave2) e.clave2 = "Las claves no coinciden.";
    setErrores(e);
    if (Object.keys(e).length > 0) return;

    setEnviando(true);
    try {
      const cuenta = await crearCuentaProveedor(cedula, clave);
      if (!cuenta.ok) {
        setErrores({ envio: cuenta.error ?? "No pudimos crear tu cuenta." });
        return;
      }
      const sb = supabase();
      const { error: eSesion } = await sb.auth.signInWithPassword({
        email: await correoInternoProveedor(cedula),
        password: clave,
      });
      if (eSesion) {
        setErrores({ envio: "No pudimos iniciar tu sesión. Inténtalo de nuevo." });
        return;
      }
      const {
        data: { session },
      } = await sb.auth.getSession();
      const uid = session!.user.id;

      const { error: ePerfil } = await sb.from("perfiles").upsert({
        id: uid,
        nombre: nombre.trim(),
        celular,
      });
      if (ePerfil) {
        setErrores({ envio: "No se pudo guardar tu perfil. Intenta de nuevo." });
        return;
      }
      const { error: eProv } = await sb.from("proveedores").insert({
        id: uid,
        documento: cedula,
        descripcion: descripcion.trim(),
        municipio,
        lat: ubicacion?.lat ?? null,
        lng: ubicacion?.lng ?? null,
      });
      if (eProv) {
        setErrores({ envio: "No se pudo enviar tu registro. Intenta de nuevo." });
        return;
      }
      await sb
        .from("proveedor_categorias")
        .insert(elegidas.map((categoriaId) => ({ proveedor_id: uid, categoria_id: categoriaId })));

      void refrescarMiProveedor();
      router.replace("/proveedor/panel");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-sm flex-col px-5 py-6">
      <button
        onClick={() => router.back()}
        aria-label="Volver"
        className="flex size-11 items-center justify-center self-start text-ink"
      >
        <ArrowLeft className="size-5" />
      </button>

      <h1 className="mt-2 font-display text-h2 font-semibold text-ink">
        Ofrece tus servicios
      </h1>
      <p className="mt-1 text-body font-body text-muted">
        Plomería, belleza, acarreos, mecánica, mandados… Los clientes publican lo
        que necesitan, tú ofertas tu precio y trabajas cuando quieras, a
        cualquier hora.
      </p>

      <div className="mt-6 flex flex-col gap-4">
        <Input
          label="Nombre completo"
          name="nombre"
          placeholder="Como aparece en tu cédula"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          error={errores.nombre}
        />
        <Input
          label="Cédula"
          name="cedula"
          inputMode="numeric"
          placeholder="1070123456"
          icon={<IdCard className="size-4" />}
          value={cedula}
          onChange={(e) => setCedula(e.target.value.replace(/\D/g, "").slice(0, 15))}
          error={errores.cedula}
        />
        <PhoneField digitos={celular} onChange={setCelular} error={errores.celular} />

        <div className="flex flex-col gap-1.5">
          <p className="text-label font-semibold uppercase tracking-wide text-muted font-body">
            <Wrench className="mr-1 inline size-3.5" />
            ¿Qué servicios ofreces?
          </p>
          <div className="flex flex-wrap gap-2">
            {categorias.map((c) => (
              <Chip
                key={c.id}
                active={elegidas.includes(c.id)}
                onClick={() => alternarCategoria(c.id)}
              >
                {c.nombre}
              </Chip>
            ))}
          </div>
          {errores.categorias && (
            <p className="text-caption text-error font-body">{errores.categorias}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="descripcion"
            className="text-label font-semibold uppercase tracking-wide text-muted font-body"
          >
            Cuéntales a los clientes qué haces
          </label>
          <textarea
            id="descripcion"
            placeholder="Plomero con 10 años de experiencia. Arreglo fugas, destapo cañerías, instalo sanitarios."
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            className="h-24 w-full resize-none rounded-md border border-border bg-surface px-3 py-2.5 text-body font-body text-ink placeholder:text-muted transition-colors duration-300 ease-in-out focus:outline-none focus:border-primary"
          />
          {errores.descripcion && (
            <p className="text-caption text-error font-body">{errores.descripcion}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <p className="text-label font-semibold uppercase tracking-wide text-muted font-body">
            Tu municipio
          </p>
          <div className="flex gap-2">
            {municipios.map((m) => (
              <Chip key={m} active={municipio === m} onClick={() => setMunicipio(m)}>
                {m}
              </Chip>
            ))}
          </div>
        </div>

        <SelectorUbicacion
          etiqueta="Tu zona de trabajo (opcional)"
          ayuda="Desde aquí calculamos qué tan lejos te quedan las solicitudes."
          onElegir={setUbicacion}
        />

        <Input
          label="Crea tu clave"
          name="clave"
          type="password"
          placeholder="Mínimo 6 caracteres"
          icon={<Lock className="size-4" />}
          value={clave}
          onChange={(e) => setClave(e.target.value)}
          error={errores.clave}
        />
        <Input
          label="Repite tu clave"
          name="clave2"
          type="password"
          placeholder="••••••"
          icon={<Lock className="size-4" />}
          value={clave2}
          onChange={(e) => setClave2(e.target.value)}
          error={errores.clave2}
        />
        <p className="-mt-2 text-caption font-body text-muted">
          Entrarás con tu cédula y esta clave. Al registrarte aceptas los{" "}
          <Link href="/legal/mensajeros" className="text-primary underline">
            términos para quienes trabajan con Pídelo
          </Link>
          .
        </p>
      </div>

      <div className="mt-auto flex flex-col gap-2 pb-4 pt-6">
        {errores.envio && (
          <p className="text-caption text-error font-body">{errores.envio}</p>
        )}
        <Button fullWidth pending={enviando} onClick={enviar}>
          Enviar registro
        </Button>
      </div>
    </div>
  );
}
