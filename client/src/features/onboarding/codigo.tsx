"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, MessageSquare, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Banner } from "@/components/ui/banner";
import { OtpInput } from "@/components/ui/otp-input";
import { formatearTelefono } from "@/components/ui/phone-field";
import { asegurarSesion, supabase } from "@/lib/supabase/cliente";
import { verificarCodigo } from "./actions";
import { leerDireccion } from "./direccion";
import { useTelefono } from "./telefono";

const MAX_INTENTOS = 5;

export function Codigo() {
  const router = useRouter();
  const [codigo, setCodigo] = useState("");
  const [verificando, setVerificando] = useState(false);
  const [error, setError] = useState(false);
  const [intentos, setIntentos] = useState(0);
  const [segundos, setSegundos] = useState(30);
  const telefono = useTelefono();
  const verificandoRef = useRef(false);

  useEffect(() => {
    if (segundos <= 0) return;
    const tick = setTimeout(() => setSegundos((s) => s - 1), 1000);
    return () => clearTimeout(tick);
  }, [segundos]);

  const bloqueado = intentos >= MAX_INTENTOS;

  async function verificar(valor: string) {
    if (verificandoRef.current || bloqueado) return;
    verificandoRef.current = true;
    setVerificando(true);
    setError(false);
    const resultado = await verificarCodigo(valor);
    if (resultado.ok) {
      // Identidad real del dispositivo (sesión anónima) + perfil con el celular.
      try {
        const usuario = await asegurarSesion();
        await supabase()
          .from("perfiles")
          .upsert({ id: usuario.id, celular: telefono || null });
      } catch {
        // Sin conexión: la sesión demo permite seguir; se reintenta luego.
      }
      router.replace(leerDireccion() ? "/home" : "/mapa");
      return;
    }
    verificandoRef.current = false;
    setVerificando(false);
    setError(true);
    setIntentos((n) => n + 1);
    setCodigo("");
  }

  function cambiarCodigo(valor: string) {
    setCodigo(valor);
    setError(false);
    // Verificación automática al completar el cuarto dígito.
    if (valor.length === 4) verificar(valor);
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

      <h1 className="mt-2 font-display text-h2 font-semibold text-ink">Escribe el código</h1>
      <p className="mt-1 text-body font-body text-muted">
        Lo enviamos al +57 {formatearTelefono(telefono)}.{" "}
        <button
          onClick={() => router.push("/ingreso")}
          className="text-primary hover:text-primary-dark"
        >
          Cambiar número
        </button>
      </p>

      <div className="mt-6 flex flex-col gap-4">
        <OtpInput
          valor={codigo}
          onChange={cambiarCodigo}
          error={error}
          deshabilitado={verificando || bloqueado}
        />

        {error && !bloqueado && (
          <p className="text-center text-caption font-body text-error">
            El código no coincide. Revisa el SMS e inténtalo de nuevo.
          </p>
        )}
        {bloqueado && (
          <Banner tone="error">
            Se acabaron los intentos. Pide un código nuevo para continuar.
          </Banner>
        )}

        <p className="text-center text-caption font-body text-muted">
          {segundos > 0 ? (
            <>
              Reenviar código en{" "}
              <span className="font-semibold text-ink">
                0:{String(segundos).padStart(2, "0")}
              </span>
            </>
          ) : (
            <button
              onClick={() => {
                setSegundos(30);
                setIntentos(0);
              }}
              className="text-primary hover:text-primary-dark"
            >
              Reenviar código
            </button>
          )}
        </p>

        <Banner tone="info" icon={<MessageSquare className="size-4" />}>
          En tu celular el código se llena solo al llegar el SMS.
        </Banner>

        {/* ⚠️ TEMPORAL: pista visible mientras no hay SMS real */}
        <p className="text-center text-caption font-body text-muted">
          Demo: usa el código <span className="font-mono text-ink">1234</span>
        </p>
      </div>

      <div className="mt-auto flex flex-col gap-3 pb-4 pt-8">
        <Button
          fullWidth
          pending={verificando}
          disabled={codigo.length < 4 || bloqueado}
          onClick={() => verificar(codigo)}
        >
          Verificar
        </Button>
        <button className="flex items-center justify-center gap-1.5 text-body font-body text-primary hover:text-primary-dark">
          <Phone className="size-4" />
          ¿Problemas? Recibir llamada
        </button>
      </div>
    </div>
  );
}
