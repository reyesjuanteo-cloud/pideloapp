"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bike, CheckCircle2, IdCard, Lock, Mail, MapPin, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Chip } from "@/components/ui/chip";
import { PhoneField, telefonoValido } from "@/components/ui/phone-field";
import { CamaraDocumento } from "@/components/ui/camara-documento";
import { comprimirImagen } from "@/components/ui/foto-input";
import { supabase } from "@/lib/supabase/cliente";
import { correoInterno, crearCuentaMensajero } from "./cuenta";
import { registrarMensajero, usePerfilMensajero } from "./perfil";
import { VerificacionFacial } from "./verificacion-facial";
import type { Municipio, ResultadoVerificacion, Vehiculo } from "./tipos";

const municipios: Municipio[] = ["Girardot", "Ricaurte", "Flandes", "Todos"];

// Placa de moto colombiana: 3 letras + 2 números + 1 letra (ej. ABC12D)
const PLACA_MOTO = /^[A-Z]{3}\d{2}[A-Z]$/;
const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

async function subirArchivo(
  uid: string,
  nombre: string,
  contenido: Blob,
  tipo: string
): Promise<void> {
  const { error } = await supabase()
    .storage.from("documentos")
    .upload(`${uid}/${nombre}`, contenido, { upsert: true, contentType: tipo });
  if (error) throw new Error(`No se pudo subir ${nombre}: ${error.message}`);
}

async function subirFoto(uid: string, nombre: string, archivo: File): Promise<void> {
  await subirArchivo(uid, `${nombre}.jpg`, await comprimirImagen(archivo), "image/jpeg");
}

export function RegistroMensajero() {
  const router = useRouter();
  const existente = usePerfilMensajero();
  const [nombre, setNombre] = useState("");
  const [documento, setDocumento] = useState("");
  const [celular, setCelular] = useState("");
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [clave2, setClave2] = useState("");
  const [municipio, setMunicipio] = useState<Municipio>("Girardot");
  const [vehiculo, setVehiculo] = useState<Vehiculo>("moto");
  const [placa, setPlaca] = useState("");
  const [fotoCedula, setFotoCedula] = useState<File | null>(null);
  const [camaraAbierta, setCamaraAbierta] = useState(false);
  const [verificacion, setVerificacion] = useState<ResultadoVerificacion | null>(null);
  const [capturaRostro, setCapturaRostro] = useState<Blob | null>(null);
  const [verificando, setVerificando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [errores, setErrores] = useState<Record<string, string>>({});

  // Con un registro en revisión o aprobado se muestra su estado; si fue
  // rechazado, puede corregir sus datos y volver a enviar.
  if (existente && existente.estado !== "rechazado") {
    router.replace("/mensajero/estado");
    return null;
  }

  async function enviar() {
    const e: Record<string, string> = {};
    if (nombre.trim().split(/\s+/).length < 2) e.nombre = "Escribe tu nombre y tu apellido.";
    if (!/^\d{6,10}$/.test(documento)) e.documento = "Escribe tu cédula sin puntos ni espacios.";
    if (!telefonoValido(celular)) e.celular = "Escribe un celular de 10 dígitos que empiece por 3.";
    if (!CORREO.test(correo.trim())) e.correo = "Escribe un correo válido para enviarte la confirmación.";
    if (clave.length < 6) e.clave = "Crea una clave de al menos 6 caracteres.";
    else if (clave !== clave2) e.clave2 = "Las claves no coinciden.";
    if (vehiculo === "moto" && !PLACA_MOTO.test(placa)) {
      e.placa = "Placa de moto: 3 letras, 2 números y 1 letra. Ej: ABC12D";
    }
    if (!fotoCedula) e.fotoCedula = "Toma la foto de tu cédula.";
    if (!verificacion) e.verificacion = "Completa la verificación facial.";
    setErrores(e);
    if (Object.keys(e).length > 0) return;

    setEnviando(true);
    try {
      // 1. Cuenta propia (cédula + clave): así puede volver a entrar después
      const cuenta = await crearCuentaMensajero(documento, clave);
      if (!cuenta.ok) {
        setErrores({ envio: cuenta.error ?? "No pudimos crear tu cuenta." });
        return;
      }
      // 2. Iniciar sesión con esa cuenta antes de guardar nada
      const sb = supabase();
      const { data: sesion, error: eSesion } = await sb.auth.signInWithPassword({
        email: await correoInterno(documento),
        password: clave,
      });
      if (eSesion || !sesion.user) {
        setErrores({ envio: "No pudimos iniciar tu sesión. Inténtalo de nuevo." });
        return;
      }
      const usuario = sesion.user;
      await subirFoto(usuario.id, "cedula", fotoCedula!);
      if (capturaRostro) {
        await subirArchivo(usuario.id, "rostro.jpg", capturaRostro, "image/jpeg");
      }
      await subirArchivo(
        usuario.id,
        "verificacion.json",
        new Blob([JSON.stringify(verificacion)], { type: "application/json" }),
        "application/json"
      );

      const resultado = await registrarMensajero({
        nombre: nombre.trim(),
        documento,
        celular,
        correo: correo.trim().toLowerCase(),
        municipio,
        vehiculo,
        ...(vehiculo === "moto" ? { placa } : {}),
      });
      if (!resultado.ok) {
        setErrores({ envio: resultado.error ?? "No se pudo enviar. Intenta de nuevo." });
        return;
      }
      router.replace("/mensajero/estado");
    } catch (err) {
      setErrores({
        envio: err instanceof Error ? err.message : "No se pudo enviar. Intenta de nuevo.",
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
        Trabaja con Pídelo
      </h1>
      <p className="mt-1 text-body font-body text-muted">
        Regístrate como mensajero. Revisamos tus datos y te avisamos por correo
        cuando puedas empezar.
      </p>

      <div className="mt-6 flex flex-col gap-4">
        <Input
          label="Nombre completo"
          name="nombre"
          autoComplete="name"
          placeholder="Juan Camilo Reyes"
          icon={<User className="size-4" />}
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          error={errores.nombre}
        />
        <Input
          label="Cédula"
          name="documento"
          inputMode="numeric"
          placeholder="1070XXXXXX"
          icon={<IdCard className="size-4" />}
          value={documento}
          onChange={(e) => setDocumento(e.target.value.replace(/\D/g, "").slice(0, 10))}
          error={errores.documento}
        />
        <PhoneField digitos={celular} onChange={setCelular} error={errores.celular} />
        <Input
          label="Correo electrónico"
          name="correo"
          type="email"
          autoComplete="email"
          placeholder="tucorreo@ejemplo.com"
          icon={<Mail className="size-4" />}
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
          error={errores.correo}
        />

        <Input
          label="Crea tu clave"
          name="clave"
          type="password"
          autoComplete="new-password"
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
          autoComplete="new-password"
          placeholder="••••••"
          icon={<Lock className="size-4" />}
          value={clave2}
          onChange={(e) => setClave2(e.target.value)}
          error={errores.clave2}
        />
        <p className="-mt-2 text-caption font-body text-muted">
          Con tu cédula y esta clave entrarás después a tu panel de mensajero.
        </p>

        <div className="flex flex-col gap-1.5">
          <p className="text-label font-semibold uppercase tracking-wide text-muted font-body">
            <MapPin className="mr-1 inline size-3.5" />
            ¿Dónde vas a trabajar?
          </p>
          <div className="flex flex-wrap gap-2">
            {municipios.map((m) => (
              <Chip key={m} active={municipio === m} onClick={() => setMunicipio(m)}>
                {m === "Todos" ? "Los tres municipios" : m}
              </Chip>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <p className="text-label font-semibold uppercase tracking-wide text-muted font-body">
            <Bike className="mr-1 inline size-3.5" />
            Tu vehículo
          </p>
          <div className="flex gap-2">
            <Chip active={vehiculo === "moto"} onClick={() => setVehiculo("moto")}>
              Moto
            </Chip>
            <Chip active={vehiculo === "bicicleta"} onClick={() => setVehiculo("bicicleta")}>
              Bicicleta
            </Chip>
          </div>
        </div>

        {vehiculo === "moto" && (
          <Input
            label="Placa de la moto"
            name="placa"
            placeholder="ABC12D"
            value={placa}
            onChange={(e) =>
              setPlaca(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))
            }
            error={errores.placa}
          />
        )}

        {/* Documento: se toma con la cámara, con guía de encuadre */}
        <div className="flex flex-col gap-1.5">
          <p className="text-label font-semibold uppercase tracking-wide text-muted font-body">
            Foto de tu cédula
          </p>
          {fotoCedula ? (
            <button
              onClick={() => setCamaraAbierta(true)}
              className="flex items-center gap-2.5 rounded-md border border-success bg-success/10 p-3 text-left text-body font-body text-success"
            >
              <CheckCircle2 className="size-5 shrink-0" />
              Foto lista — toca para repetirla
            </button>
          ) : (
            <Button variant="secondary" onClick={() => setCamaraAbierta(true)}>
              Tomar foto de la cédula
            </Button>
          )}
          {errores.fotoCedula && (
            <p className="text-caption text-error font-body">{errores.fotoCedula}</p>
          )}
        </div>

        {/* Verificación facial en vivo: requiere la foto de la cédula primero */}
        <div className="flex flex-col gap-1.5">
          <p className="text-label font-semibold uppercase tracking-wide text-muted font-body">
            Verificación facial
          </p>
          {verificacion ? (
            <div className="flex items-center gap-2.5 rounded-md border border-success bg-success/10 p-3 text-body font-body text-success">
              <CheckCircle2 className="size-5 shrink-0" />
              Verificación completada
            </div>
          ) : (
            <Button
              variant="secondary"
              onClick={() => {
                if (!fotoCedula) {
                  setErrores((prev) => ({
                    ...prev,
                    verificacion: "Primero toma la foto de tu cédula.",
                  }));
                  return;
                }
                setErrores((prev) => ({ ...prev, verificacion: "" }));
                setVerificando(true);
              }}
            >
              Iniciar verificación con la cámara
            </Button>
          )}
          {errores.verificacion && (
            <p className="text-caption text-error font-body">{errores.verificacion}</p>
          )}
        </div>

        <p className="text-caption font-body text-muted">
          Al registrarte aceptas los{" "}
          <Link href="/legal/mensajeros" className="text-primary underline">
            términos para mensajeros
          </Link>{" "}
          y el{" "}
          <Link href="/legal/permisos" className="text-primary underline">
            uso de tu cámara, ubicación y datos biométricos
          </Link>
          . La verificación facial ocurre en tu celular y puedes negarte a ella:
          el equipo revisa tu registro a mano.
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

      {camaraAbierta && (
        <CamaraDocumento
          titulo="Foto de tu cédula"
          instruccion="Encuadra tu documento aquí"
          onTomar={(foto) => {
            setFotoCedula(foto);
            setCamaraAbierta(false);
            setErrores((prev) => ({ ...prev, fotoCedula: "" }));
          }}
          onCerrar={() => setCamaraAbierta(false)}
        />
      )}

      {verificando && fotoCedula && (
        <VerificacionFacial
          fotoCedula={fotoCedula}
          onCompletar={(resultado, captura) => {
            setVerificacion(resultado);
            setCapturaRostro(captura);
            setVerificando(false);
          }}
          onCerrar={() => setVerificando(false)}
        />
      )}
    </div>
  );
}
