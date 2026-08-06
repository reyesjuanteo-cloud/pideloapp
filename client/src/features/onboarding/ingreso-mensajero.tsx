"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { IdCard, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase/cliente";
import { correoInterno } from "@/features/mensajero/cuenta";
import { refrescarPerfilMensajero } from "@/features/mensajero/perfil";

export function IngresoMensajero() {
  const router = useRouter();
  const [cedula, setCedula] = useState("");
  const [clave, setClave] = useState("");
  const [entrando, setEntrando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function entrar() {
    if (!/^\d{6,10}$/.test(cedula) || clave.length < 6) {
      setError("Revisa tu cédula y tu clave.");
      return;
    }
    setEntrando(true);
    setError(null);
    const sb = supabase();
    // Sesión limpia: si el celular venía con una sesión de cliente, estorba.
    await sb.auth.signOut();
    const { data, error: e } = await sb.auth.signInWithPassword({
      email: await correoInterno(cedula),
      password: clave,
    });
    if (e || !data.user) {
      setEntrando(false);
      setError("Cédula o clave incorrecta.");
      return;
    }

    // Según su estado: revisión, rechazado o listo para trabajar
    const { data: mensajero } = await sb
      .from("mensajeros")
      .select("estado")
      .eq("id", data.user.id)
      .maybeSingle();
    void refrescarPerfilMensajero();
    setEntrando(false);
    router.replace(
      mensajero?.estado === "aprobado" ? "/driver/dashboard" : "/mensajero/estado"
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-body font-body text-muted">
        Entra con la cédula y la clave que creaste al registrarte.
      </p>
      <Input
        label="Cédula"
        name="cedula-mensajero"
        inputMode="numeric"
        placeholder="1070XXXXXX"
        icon={<IdCard className="size-4" />}
        value={cedula}
        onChange={(e) => {
          setCedula(e.target.value.replace(/\D/g, "").slice(0, 10));
          setError(null);
        }}
      />
      <Input
        label="Clave"
        name="clave-mensajero"
        type="password"
        autoComplete="current-password"
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
        Entrar a mi panel
      </Button>
      <Link
        href="/mensajero/registro"
        className="text-center text-body font-body text-primary hover:text-primary-dark"
      >
        Aún no me he registrado como mensajero
      </Link>
    </div>
  );
}
