"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/cliente";

// Las pantallas de cliente exigen una cuenta: sin sesión se va a la
// bienvenida, y con sesión sin nombre se completan primero los datos.
export function ExigirCliente({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [estado, setEstado] = useState<"revisando" | "listo">("revisando");

  useEffect(() => {
    let vigente = true;
    (async () => {
      const sb = supabase();
      const {
        data: { session },
      } = await sb.auth.getSession();
      if (!session) {
        router.replace("/bienvenida");
        return;
      }
      const { data: perfil } = await sb
        .from("perfiles")
        .select("nombre")
        .eq("id", session.user.id)
        .maybeSingle();
      if (!vigente) return;
      if (!perfil?.nombre) {
        router.replace("/tus-datos");
        return;
      }
      setEstado("listo");
    })();
    return () => {
      vigente = false;
    };
  }, [router]);

  if (estado === "revisando") {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <p className="text-body font-body text-muted">Un momento…</p>
      </div>
    );
  }
  return <>{children}</>;
}
