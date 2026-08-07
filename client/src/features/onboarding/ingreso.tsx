"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PhoneField, telefonoValido } from "@/components/ui/phone-field";
import { guardarTelefono } from "./telefono";
import { IngresoMensajero } from "./ingreso-mensajero";
import { IngresoNegocio } from "./ingreso-negocio";

export function Ingreso() {
  const router = useRouter();
  const [digitos, setDigitos] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [enviando, setEnviando] = useState(false);
  // Por defecto entra el cliente; el mensajero cambia de pestaña.
  const [pestana, setPestana] = useState<"cliente" | "mensajero" | "negocio">(
    "cliente"
  );

  function continuar() {
    if (!telefonoValido(digitos)) {
      setError("Escribe un celular colombiano de 10 dígitos que empiece por 3.");
      return;
    }
    setError(undefined);
    setEnviando(true);
    // ⚠️ TEMPORAL: sin proveedor de SMS todavía — pasamos directo a la pantalla
    // de código, que acepta el código demo 1234.
    guardarTelefono(digitos);
    router.push("/codigo");
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

      {/* Dos formas de entrar: cliente (por defecto) o mensajero */}
      <div className="mt-2 flex gap-2 rounded-full bg-bg p-1">
        {(["cliente", "mensajero", "negocio"] as const).map((valor) => (
          <button
            key={valor}
            onClick={() => setPestana(valor)}
            className={`flex-1 rounded-full py-2 text-caption font-semibold font-body transition-colors duration-300 ease-in-out ${
              pestana === valor ? "bg-primary text-white" : "text-muted hover:text-ink"
            }`}
          >
            {valor === "cliente"
              ? "Cliente"
              : valor === "mensajero"
                ? "Domiciliario"
                : "Negocio"}
          </button>
        ))}
      </div>

      <h1 className="mt-5 font-display text-h2 font-semibold text-ink">
        {pestana === "cliente"
          ? "Ingresa o crea tu cuenta"
          : pestana === "mensajero"
            ? "Entra a tu panel"
            : "Entra a tu negocio"}
      </h1>
      {pestana === "cliente" && (
        <p className="mt-1 text-body font-body text-muted">
          Te enviamos un código por SMS. Sin contraseñas.
        </p>
      )}

      {pestana === "mensajero" ? (
        <div className="mt-6">
          <IngresoMensajero />
        </div>
      ) : pestana === "negocio" ? (
        <div className="mt-6">
          <IngresoNegocio />
        </div>
      ) : (
      <>
      <div className="mt-6 flex flex-col gap-4">
        <PhoneField
          digitos={digitos}
          onChange={(valor) => {
            setDigitos(valor);
            setError(undefined);
          }}
          error={error}
        />
        <Button fullWidth pending={enviando} disabled={digitos.length < 10} onClick={continuar}>
          Continuar
        </Button>
      </div>


      </>
      )}

      <div className="mt-auto flex flex-col gap-3 pb-4 pt-8 text-center">
        <p className="text-caption font-body text-muted">
          Al continuar aceptas los{" "}
          <Link href="/legal/terminos" className="text-primary underline">
            términos
          </Link>{" "}
          y autorizas el{" "}
          <Link href="/legal/autorizacion-datos" className="text-primary underline">
            tratamiento de tus datos
          </Link>{" "}
          (Ley 1581 de 2012).
        </p>
      </div>
    </div>
  );
}
