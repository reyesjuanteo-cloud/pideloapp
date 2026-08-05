"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Apple, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PhoneField, telefonoValido } from "@/components/ui/phone-field";

export function Ingreso() {
  const router = useRouter();
  const [digitos, setDigitos] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [enviando, setEnviando] = useState(false);

  function continuar() {
    if (!telefonoValido(digitos)) {
      setError("Escribe un celular colombiano de 10 dígitos que empiece por 3.");
      return;
    }
    setError(undefined);
    setEnviando(true);
    // ⚠️ TEMPORAL: sin proveedor de SMS todavía — pasamos directo a la pantalla
    // de código, que acepta el código demo 1234.
    window.sessionStorage.setItem("pidelo-telefono", digitos);
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

      <h1 className="mt-2 font-display text-h2 font-semibold text-ink">
        Ingresa o crea tu cuenta
      </h1>
      <p className="mt-1 text-body font-body text-muted">
        Te enviamos un código por SMS. Sin contraseñas.
      </p>

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

      <div className="my-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-caption font-body text-muted">o</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <div className="flex flex-col gap-2.5">
        <Button fullWidth variant="secondary" disabled title="Disponible pronto">
          <span className="font-semibold">G</span>
          Continuar con Google
        </Button>
        <Button fullWidth variant="secondary" disabled title="Disponible pronto">
          <Apple className="size-4" />
          Continuar con Apple
        </Button>
      </div>

      <div className="mt-auto flex flex-col gap-3 pb-4 pt-8 text-center">
        <Link
          href="/home"
          className="text-body font-body text-primary hover:text-primary-dark"
        >
          Explorar sin cuenta
        </Link>
        <p className="text-caption font-body text-muted">
          Al continuar aceptas los términos y la política de tratamiento de datos
          (Ley 1581 de 2012).
        </p>
      </div>
    </div>
  );
}
