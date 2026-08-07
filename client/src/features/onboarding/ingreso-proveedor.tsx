"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { IdCard, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase/cliente";
import { correoInternoProveedor } from "@/features/servicios/cuenta";
import { refrescarMiProveedor } from "@/features/servicios/datos";

export function IngresoProveedor() {
  const router = useRouter();
  const [cedula, setCedula] = useState("");
  const [clave, setClave] = useState("");
  const [entrando, setEntrando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function entrar() {
    if (!/^\d{6,15}$/.test(cedula) || clave.length < 6) {
      setError("Revisa tu cédula y tu clave.");
      return;
    }
    setEntrando(true);
    setError(null);
    const sb = supabase();
    await sb.auth.signOut();
    const { error: e } = await sb.auth.signInWithPassword({
      email: await correoInternoProveedor(cedula),
      password: clave,
    });
    setEntrando(false);
    if (e) {
      setError("Cédula o clave incorrecta.");
      return;
    }
    void refrescarMiProveedor();
    router.replace("/proveedor/panel");
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-body font-body text-muted">
        Entra con la cédula y la clave que creaste al registrarte como proveedor
        de servicios.
      </p>
      <Input
        label="Cédula"
        name="cedula-proveedor"
        inputMode="numeric"
        placeholder="1070123456"
        icon={<IdCard className="size-4" />}
        value={cedula}
        onChange={(e) => {
          setCedula(e.target.value.replace(/\D/g, "").slice(0, 15));
          setError(null);
        }}
      />
      <Input
        label="Clave"
        name="clave-proveedor"
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
        Entrar a mis servicios
      </Button>
      <Link
        href="/proveedor/registro"
        className="text-center text-body font-body text-primary hover:text-primary-dark"
      >
        Quiero ofrecer mis servicios
      </Link>
    </div>
  );
}
