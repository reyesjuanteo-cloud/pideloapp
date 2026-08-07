"use client";

// Registro único para trabajar con Pídelo (domicilios, mandados y servicios).
// Misma exigencia que tenía el registro de mensajeros: foto de la cédula con
// encuadre y verificación facial en el celular — el equipo revisa antes de
// aprobar. Los puntajes nunca se muestran al aspirante.
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, IdCard, Lock, Mail, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Chip } from "@/components/ui/chip";
import { PhoneField, telefonoValido } from "@/components/ui/phone-field";
import { CamaraDocumento } from "@/components/ui/camara-documento";
import { comprimirImagen } from "@/components/ui/foto-input";
import {
  SelectorUbicacion,
  type UbicacionElegida,
} from "@/components/ui/selector-ubicacion";
import { supabase } from "@/lib/supabase/cliente";
import { VerificacionFacial } from "@/features/mensajero/verificacion-facial";
import type { ResultadoVerificacion } from "@/features/mensajero/tipos";
import { correoInternoProveedor, crearCuentaProveedor } from "./cuenta";
import { refrescarMiProveedor, useCategoriasServicio } from "./datos";

const municipios = ["Girardot", "Ricaurte", "Flandes", "Todos"] as const;
const vehiculos = ["Moto", "Bicicleta", "Carro o camioneta", "A pie"] as const;
const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Categorías que implican moverse con un vehículo: piden cuál y su placa
const CATEGORIAS_CON_VEHICULO = ["mandados y domicilios", "acarreos y trasteos"];

async function subirArchivo(
  uid: string,
  nombre: string,
  contenido: Blob,
  tipo: string
): Promise<void> {
  await supabase()
    .storage.from("documentos")
    .upload(`${uid}/${nombre}`, contenido, { contentType: tipo, upsert: true });
}

export function RegistroProveedor() {
  const router = useRouter();
  const categorias = useCategoriasServicio();
  const [nombre, setNombre] = useState("");
  const [cedula, setCedula] = useState("");
  const [celular, setCelular] = useState("");
  const [correo, setCorreo] = useState("");
  const [elegidas, setElegidas] = useState<string[]>([]);
  const [descripcion, setDescripcion] = useState("");
  const [municipio, setMunicipio] = useState<(typeof municipios)[number]>("Girardot");
  const [vehiculo, setVehiculo] = useState<(typeof vehiculos)[number]>("Moto");
  const [placa, setPlaca] = useState("");
  const [ubicacion, setUbicacion] = useState<UbicacionElegida | null>(null);
  const [fotoCedula, setFotoCedula] = useState<File | null>(null);
  const [camaraAbierta, setCamaraAbierta] = useState(false);
  const [verificacion, setVerificacion] = useState<ResultadoVerificacion | null>(null);
  const [capturaRostro, setCapturaRostro] = useState<Blob | null>(null);
  const [verificando, setVerificando] = useState(false);
  const [clave, setClave] = useState("");
  const [clave2, setClave2] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [errores, setErrores] = useState<Record<string, string>>({});

  const nombresElegidos = categorias
    .filter((c) => elegidas.includes(c.id))
    .map((c) => c.nombre.toLowerCase());
  const pideVehiculo = nombresElegidos.some((n) =>
    CATEGORIAS_CON_VEHICULO.includes(n)
  );
  const pidePlaca =
    pideVehiculo && (vehiculo === "Moto" || vehiculo === "Carro o camioneta");

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
    if (!CORREO.test(correo.trim())) e.correo = "Escribe un correo válido.";
    if (elegidas.length === 0) e.categorias = "Elige al menos un servicio que ofreces.";
    if (descripcion.trim().length < 10)
      e.descripcion = "Cuéntanos qué haces y tu experiencia (mínimo 10 letras).";
    if (pidePlaca && !/^[A-Z0-9]{5,6}$/.test(placa))
      e.placa = "Escribe la placa (ej. ABC12D).";
    if (!fotoCedula) e.fotoCedula = "Toma la foto de tu cédula.";
    if (!verificacion) e.verificacion = "Completa la verificación facial.";
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

      // Documentos al almacenamiento privado: solo el equipo los ve
      await subirArchivo(uid, "cedula.jpg", await comprimirImagen(fotoCedula!), "image/jpeg");
      if (capturaRostro) {
        await subirArchivo(uid, "rostro.jpg", capturaRostro, "image/jpeg");
      }
      await subirArchivo(
        uid,
        "verificacion.json",
        new Blob([JSON.stringify(verificacion)], { type: "application/json" }),
        "application/json"
      );

      const { error: ePerfil } = await sb.from("perfiles").upsert({
        id: uid,
        nombre: nombre.trim(),
        celular,
        correo: correo.trim().toLowerCase(),
      });
      if (ePerfil) {
        setErrores({ envio: "No se pudo guardar tu perfil. Intenta de nuevo." });
        return;
      }
      const { error: eProv } = await sb.from("proveedores").upsert({
        id: uid,
        documento: cedula,
        descripcion: descripcion.trim(),
        municipio,
        lat: ubicacion?.lat ?? null,
        lng: ubicacion?.lng ?? null,
        vehiculo: pideVehiculo ? vehiculo : null,
        placa: pidePlaca ? placa : null,
      });
      if (eProv) {
        setErrores({ envio: "No se pudo enviar tu registro. Intenta de nuevo." });
        return;
      }
      await sb
        .from("proveedor_categorias")
        .insert(
          elegidas.map((categoriaId) => ({ proveedor_id: uid, categoria_id: categoriaId }))
        );

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
        Trabaja con Pídelo
      </h1>
      <p className="mt-1 text-body font-body text-muted">
        Domicilios, mandados, plomería, belleza, acarreos… Los clientes publican
        lo que necesitan, tú ofertas tu precio y trabajas cuando quieras, a
        cualquier hora. Revisamos tu registro antes de activarte.
      </p>

      <div className="mt-6 flex flex-col gap-4">
        <Input
          label="Nombre completo"
          name="nombre"
          autoComplete="name"
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
        <Input
          label="Correo electrónico"
          name="correo"
          type="email"
          placeholder="tucorreo@ejemplo.com"
          icon={<Mail className="size-4" />}
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
          error={errores.correo}
        />

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
            ¿Dónde trabajas?
          </p>
          <div className="flex flex-wrap gap-2">
            {municipios.map((m) => (
              <Chip key={m} active={municipio === m} onClick={() => setMunicipio(m)}>
                {m === "Todos" ? "Los tres municipios" : m}
              </Chip>
            ))}
          </div>
        </div>

        {pideVehiculo && (
          <div className="flex flex-col gap-1.5">
            <p className="text-label font-semibold uppercase tracking-wide text-muted font-body">
              ¿En qué te mueves?
            </p>
            <div className="flex flex-wrap gap-2">
              {vehiculos.map((v) => (
                <Chip key={v} active={vehiculo === v} onClick={() => setVehiculo(v)}>
                  {v}
                </Chip>
              ))}
            </div>
          </div>
        )}
        {pidePlaca && (
          <Input
            label={vehiculo === "Moto" ? "Placa de la moto" : "Placa del vehículo"}
            name="placa"
            placeholder="ABC12D"
            value={placa}
            onChange={(e) =>
              setPlaca(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))
            }
            error={errores.placa}
          />
        )}

        <SelectorUbicacion
          etiqueta="Tu zona de trabajo (opcional)"
          ayuda="Desde aquí calculamos qué tan lejos te quedan las solicitudes."
          onElegir={setUbicacion}
        />

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
          </Link>{" "}
          y el{" "}
          <Link href="/legal/permisos" className="text-primary underline">
            uso de tu cámara, ubicación y datos biométricos
          </Link>
          . La verificación ocurre en tu celular y puedes negarte a ella: el
          equipo revisa tu registro a mano.
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
