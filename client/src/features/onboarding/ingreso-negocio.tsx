"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { IdCard, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase/cliente";
import { correoInternoNegocio } from "@/features/negocio/cuenta";
import { refrescarMiNegocio } from "@/features/negocio/mi-negocio";

export function IngresoNegocio() {
  const router = useRouter();
  const [documento, setDocumento] = useState("");
  const [clave, setClave] = useState("");
  const [entrando, setEntrando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function entrar() {
    if (!/^\d{6,15}$/.test(documento) || clave.length < 6) {
      setError("Revisa tu documento y tu clave.");
      return;
    }
    setEntrando(true);
    setError(null);
    const sb = supabase();
    await sb.auth.signOut();
    const { error: e } = await sb.auth.signInWithPassword({
      email: await correoInternoNegocio(documento),
      password: clave,
    });
    setEntrando(false);
    if (e) {
      setError("Documento o clave incorrecta.");
      return;
    }
    void refrescarMiNegocio();
    router.replace("/negocio/panel");
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-body font-body text-muted">
        Entra con el NIT o cédula y la clave que creaste al registrar tu negocio.
      </p>
      <Input
        label="NIT o cédula"
        name="documento-negocio"
        inputMode="numeric"
        placeholder="900123456"
        icon={<IdCard className="size-4" />}
        value={documento}
        onChange={(e) => {
          setDocumento(e.target.value.replace(/\D/g, "").slice(0, 15));
          setError(null);
        }}
      />
      <Input
        label="Clave"
        name="clave-negocio"
        type="password"
        placeholder="••••••"
        icon={<Lock className="size-4" />}
        value={clave}
        onChange={(e) => {
          setClave(e.target.value);
          setError(null);
        }}
        onKeyDown={(e) => e.key === "Enter" && entrar()}
        error={error ?? undefined}
      />
      <Button fullWidth pending={entrando} onClick={entrar}>
        Entrar a mi negocio
      </Button>
      <Link
        href="/negocio/registro"
        className="text-center text-body font-body text-primary hover:text-primary-dark"
      >
        Aún no he registrado mi negocio
      </Link>
    </div>
  );
}
