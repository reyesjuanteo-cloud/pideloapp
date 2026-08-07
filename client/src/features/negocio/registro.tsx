"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, IdCard, Lock, Mail, MapPin, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Chip } from "@/components/ui/chip";
import { PhoneField, telefonoValido } from "@/components/ui/phone-field";
import { supabase } from "@/lib/supabase/cliente";
import { correoInternoNegocio, crearCuentaNegocio } from "./cuenta";
import { registrarNegocio } from "./mi-negocio";

const categorias = ["Comida", "Mercado", "Farmacia", "Panadería", "Otro"];
const municipios = ["Girardot", "Ricaurte", "Flandes"];
const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function RegistroNegocio() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [categoria, setCategoria] = useState("Comida");
  const [municipio, setMunicipio] = useState("Girardot");
  const [direccion, setDireccion] = useState("");
  const [documento, setDocumento] = useState("");
  const [celular, setCelular] = useState("");
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [clave2, setClave2] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [errores, setErrores] = useState<Record<string, string>>({});

  async function enviar() {
    const e: Record<string, string> = {};
    if (nombre.trim().length < 3) e.nombre = "Escribe el nombre de tu negocio.";
    if (direccion.trim().length < 5) e.direccion = "Escribe la dirección de tu local.";
    if (!/^\d{6,15}$/.test(documento)) e.documento = "NIT o cédula, sin puntos ni guiones.";
    if (!telefonoValido(celular)) e.celular = "Celular de 10 dígitos que empiece por 3.";
    if (!CORREO.test(correo.trim())) e.correo = "Escribe un correo válido.";
    if (clave.length < 6) e.clave = "Crea una clave de al menos 6 caracteres.";
    else if (clave !== clave2) e.clave2 = "Las claves no coinciden.";
    setErrores(e);
    if (Object.keys(e).length > 0) return;

    setEnviando(true);
    try {
      const cuenta = await crearCuentaNegocio(documento, clave);
      if (!cuenta.ok) {
        setErrores({ envio: cuenta.error ?? "No pudimos crear tu cuenta." });
        return;
      }
      const sb = supabase();
      const { error: eSesion } = await sb.auth.signInWithPassword({
        email: await correoInternoNegocio(documento),
        password: clave,
      });
      if (eSesion) {
        setErrores({ envio: "No pudimos iniciar tu sesión. Inténtalo de nuevo." });
        return;
      }

      // Ubicar el local en el mapa a partir de su dirección
      let lat: number | null = null;
      let lng: number | null = null;
      try {
        const r = await fetch(
          `/api/direcciones?q=${encodeURIComponent(`${direccion}, ${municipio}`)}`
        );
        const lugares = r.ok ? await r.json() : [];
        if (Array.isArray(lugares) && lugares[0]) {
          lat = lugares[0].lat;
          lng = lugares[0].lng;
        }
      } catch {
        // Sin coordenadas: el equipo las puede ajustar después.
      }

      const resultado = await registrarNegocio({
        nombre: nombre.trim(),
        categoria,
        zona: municipio,
        direccion: direccion.trim(),
        lat,
        lng,
        documento,
        celular,
        correo: correo.trim().toLowerCase(),
      });
      if (!resultado.ok) {
        setErrores({ envio: resultado.error ?? "No se pudo enviar el registro." });
        return;
      }
      router.replace("/negocio/panel");
    } catch (err) {
      setErrores({
        envio: err instanceof Error ? err.message : "No se pudo enviar el registro.",
      });
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
        Registra tu negocio
      </h1>
      <p className="mt-1 text-body font-body text-muted">
        Recibe pedidos de tu zona. Revisamos tus datos y te avisamos cuando tu
        negocio quede publicado.
      </p>

      <div className="mt-6 flex flex-col gap-4">
        <Input
          label="Nombre del negocio"
          name="nombre"
          placeholder="Arepería La 14"
          icon={<Store className="size-4" />}
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          error={errores.nombre}
        />

        <div className="flex flex-col gap-1.5">
          <p className="text-label font-semibold uppercase tracking-wide text-muted font-body">
            ¿Qué vendes?
          </p>
          <div className="flex flex-wrap gap-2">
            {categorias.map((c) => (
              <Chip key={c} active={categoria === c} onClick={() => setCategoria(c)}>
                {c}
              </Chip>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <p className="text-label font-semibold uppercase tracking-wide text-muted font-body">
            <MapPin className="mr-1 inline size-3.5" />
            Municipio
          </p>
          <div className="flex gap-2">
            {municipios.map((m) => (
              <Chip key={m} active={municipio === m} onClick={() => setMunicipio(m)}>
                {m}
              </Chip>
            ))}
          </div>
        </div>

        <Input
          label="Dirección del local"
          name="direccion"
          placeholder="Carrera 10 #15-20"
          icon={<MapPin className="size-4" />}
          value={direccion}
          onChange={(e) => setDireccion(e.target.value)}
          error={errores.direccion}
        />
        <p className="-mt-2 text-caption font-body text-muted">
          Es la dirección donde el mensajero recoge los pedidos.
        </p>

        <Input
          label="NIT o cédula"
          name="documento"
          inputMode="numeric"
          placeholder="900123456"
          icon={<IdCard className="size-4" />}
          value={documento}
          onChange={(e) => setDocumento(e.target.value.replace(/\D/g, "").slice(0, 15))}
          error={errores.documento}
        />
        <PhoneField digitos={celular} onChange={setCelular} error={errores.celular} />
        <Input
          label="Correo electrónico"
          name="correo"
          type="email"
          placeholder="tunegocio@correo.com"
          icon={<Mail className="size-4" />}
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
          error={errores.correo}
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
          Con tu NIT o cédula y esta clave entrarás a administrar tu negocio.
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
