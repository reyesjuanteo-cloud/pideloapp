"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bike, IdCard, MapPin, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Chip } from "@/components/ui/chip";
import { PhoneField, telefonoValido } from "@/components/ui/phone-field";
import { FotoInput, comprimirImagen } from "@/components/ui/foto-input";
import { asegurarSesion, supabase } from "@/lib/supabase/cliente";
import { registrarMensajero, usePerfilMensajero } from "./perfil";
import { VerificacionFacial } from "./verificacion-facial";
import type { Municipio, ResultadoVerificacion, Vehiculo } from "./tipos";

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
  const blob = await comprimirImagen(archivo);
  await subirArchivo(uid, `${nombre}.jpg`, blob, "image/jpeg");
}

const municipios: Municipio[] = ["Girardot", "Ricaurte", "Flandes"];

// Placa de moto colombiana: 3 letras + 2 números + 1 letra (ej. ABC12D)
const PLACA_MOTO = /^[A-Z]{3}\d{2}[A-Z]$/;

export function RegistroMensajero() {
  const router = useRouter();
  const existente = usePerfilMensajero();
  const [nombre, setNombre] = useState("");
  const [documento, setDocumento] = useState("");
  const [celular, setCelular] = useState("");
  const [municipio, setMunicipio] = useState<Municipio>("Girardot");
  const [vehiculo, setVehiculo] = useState<Vehiculo>("moto");
  const [placa, setPlaca] = useState("");
  const [licencia, setLicencia] = useState("");
  const [soat, setSoat] = useState(false);
  const [fotoCedula, setFotoCedula] = useState<File | null>(null);
  const [fotoSelfie, setFotoSelfie] = useState<File | null>(null);
  const [fotoLicencia, setFotoLicencia] = useState<File | null>(null);
  const [fotoSoat, setFotoSoat] = useState<File | null>(null);
  const [verificacion, setVerificacion] = useState<ResultadoVerificacion | null>(null);
  const [capturaRostro, setCapturaRostro] = useState<Blob | null>(null);
  const [verificando, setVerificando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [errores, setErrores] = useState<Record<string, string>>({});

  if (existente) {
    // Ya hay un registro en este dispositivo: mostrar su estado, no otro formulario.
    router.replace("/mensajero/estado");
    return null;
  }

  async function enviar() {
    const e: Record<string, string> = {};
    if (nombre.trim().length < 5) e.nombre = "Escribe tu nombre completo.";
    if (!/^\d{6,10}$/.test(documento)) e.documento = "Escribe tu cédula sin puntos ni espacios.";
    if (!telefonoValido(celular)) e.celular = "Escribe un celular de 10 dígitos que empiece por 3.";
    if (vehiculo === "moto") {
      if (!PLACA_MOTO.test(placa)) e.placa = "Placa de moto: 3 letras, 2 números y 1 letra. Ej: ABC12D";
      if (!/^\d{6,12}$/.test(licencia)) e.licencia = "Escribe el número de tu licencia de conducción.";
      if (!soat) e.soat = "Necesitas SOAT vigente para trabajar en moto.";
      if (!fotoLicencia) e.fotoLicencia = "Toma una foto de tu licencia.";
      if (!fotoSoat) e.fotoSoat = "Toma una foto de tu SOAT vigente.";
    }
    if (!fotoCedula) e.fotoCedula = "Toma una foto de tu cédula por el frente.";
    if (!fotoSelfie) e.fotoSelfie = "Tómate una selfie sosteniendo tu cédula.";
    if (!verificacion) e.verificacion = "Completa la verificación facial.";
    setErrores(e);
    if (Object.keys(e).length > 0) return;

    setEnviando(true);
    try {
      // Fotos primero: sin documentos no se crea el registro.
      const usuario = await asegurarSesion();
      await subirFoto(usuario.id, "cedula", fotoCedula!);
      await subirFoto(usuario.id, "selfie", fotoSelfie!);
      if (vehiculo === "moto") {
        await subirFoto(usuario.id, "licencia", fotoLicencia!);
        await subirFoto(usuario.id, "soat", fotoSoat!);
      }
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
        municipio,
        vehiculo,
        ...(vehiculo === "moto" ? { placa, licencia, soatVigente: soat } : {}),
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
        Regístrate como mensajero. Revisamos tus datos y te avisamos cuando puedas
        empezar a recibir pedidos.
      </p>

      <div className="mt-6 flex flex-col gap-4">
        <Input
          label="Nombre completo"
          name="nombre"
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

        <div className="flex flex-col gap-1.5">
          <p className="text-label font-semibold uppercase tracking-wide text-muted font-body">
            <MapPin className="mr-1 inline size-3.5" />
            ¿Dónde vas a trabajar?
          </p>
          <div className="flex gap-2">
            {municipios.map((m) => (
              <Chip key={m} active={municipio === m} onClick={() => setMunicipio(m)}>
                {m}
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
          <>
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
            <Input
              label="Número de licencia"
              name="licencia"
              inputMode="numeric"
              placeholder="1070XXXXXX"
              value={licencia}
              onChange={(e) => setLicencia(e.target.value.replace(/\D/g, "").slice(0, 12))}
              error={errores.licencia}
            />
            <div className="flex flex-col gap-1">
              <label className="flex items-center gap-2.5 rounded-md border border-border bg-surface p-3 text-body font-body text-ink">
                <input
                  type="checkbox"
                  checked={soat}
                  onChange={(e) => setSoat(e.target.checked)}
                  className="size-4 accent-[#e8380d]"
                />
                Declaro que tengo SOAT vigente
              </label>
              {errores.soat && (
                <p className="text-caption text-error font-body">{errores.soat}</p>
              )}
            </div>
          </>
        )}

        <FotoInput
          label="Foto de tu cédula (frente)"
          ayuda="Que se lean bien los datos"
          valor={fotoCedula}
          onChange={setFotoCedula}
          error={errores.fotoCedula}
        />
        <FotoInput
          label="Selfie sosteniendo tu cédula"
          ayuda="Tu cara y la cédula visibles en la misma foto"
          valor={fotoSelfie}
          onChange={setFotoSelfie}
          error={errores.fotoSelfie}
        />
        {vehiculo === "moto" && (
          <>
            <FotoInput
              label="Foto de tu licencia de conducción"
              valor={fotoLicencia}
              onChange={setFotoLicencia}
              error={errores.fotoLicencia}
            />
            <FotoInput
              label="Foto de tu SOAT vigente"
              ayuda="Que se vea la fecha de vencimiento"
              valor={fotoSoat}
              onChange={setFotoSoat}
              error={errores.fotoSoat}
            />
          </>
        )}

        {/* Verificación facial en vivo: requiere la foto de la cédula primero */}
        <div className="flex flex-col gap-1.5">
          <p className="text-label font-semibold uppercase tracking-wide text-muted font-body">
            Verificación facial
          </p>
          {verificacion ? (
            <div className="flex items-center gap-2.5 rounded-md border border-success bg-success/10 p-3 text-body font-body text-success">
              ✓ Verificado — similitud con cédula:{" "}
              {verificacion.similitud !== null
                ? `${Math.round(verificacion.similitud * 100)}%`
                : "sin rostro legible en la cédula"}
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
          Tus datos y documentos se usan solo para verificar tu registro y se tratan
          según la Ley 1581 de 2012. La verificación facial ocurre en tu celular.
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
