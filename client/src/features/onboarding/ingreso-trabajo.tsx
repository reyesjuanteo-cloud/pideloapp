"use client";

// Puerta única para quienes trabajan con Pídelo. Prueba primero la cuenta de
// proveedor de servicios (el sistema unificado) y, si no existe, la cuenta
// vieja de mensajero — así nadie pierde su acceso.
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { IdCard, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase/cliente";
import { correoInternoProveedor } from "@/features/servicios/cuenta";
import { correoInterno as correoInternoMensajero } from "@/features/mensajero/cuenta";
import { refrescarMiProveedor } from "@/features/servicios/datos";

export function IngresoTrabajo() {
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

    // 1. Proveedor de servicios (subasta): el sistema actual
    const { error: eProveedor } = await sb.auth.signInWithPassword({
      email: await correoInternoProveedor(cedula),
      password: clave,
    });
    if (!eProveedor) {
      void refrescarMiProveedor();
      router.replace("/proveedor/panel");
      return;
    }

    // 2. Cuenta de mensajero (pedidos de tiendas aliadas)
    const { error: eMensajero } = await sb.auth.signInWithPassword({
      email: await correoInternoMensajero(cedula),
      password: clave,
    });
    setEntrando(false);
    if (eMensajero) {
      setError("Cédula o clave incorrecta.");
      return;
    }
    const {
      data: { session },
    } = await sb.auth.getSession();
    const { data: mensajero } = await sb
      .from("mensajeros")
      .select("estado")
      .eq("id", session!.user.id)
      .maybeSingle();
    router.replace(
      mensajero?.estado === "aprobado" ? "/driver/dashboard" : "/mensajero/estado"
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-body font-body text-muted">
        Domicilios, mandados, plomería, belleza… entra con tu cédula y tu clave.
      </p>
      <Input
        label="Cédula"
        name="cedula-trabajo"
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
        name="clave-trabajo"
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
        Entrar
      </Button>
      <Link
        href="/proveedor/registro"
        className="text-center text-body font-body text-primary hover:text-primary-dark"
      >
        Quiero trabajar con Pídelo
      </Link>
    </div>
  );
}
