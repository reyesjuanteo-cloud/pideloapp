"use client";

import { useState, useSyncExternalStore, type ReactNode } from "react";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// ⚠️ TEMPORAL: clave fija hasta tener roles reales (Supabase Auth). Las
// server actions del admin la re-verifican en el servidor.
const CLAVE_ADMIN = "admin123";
const CLAVE_SESION = "pidelo-admin-clave";
const EVENTO = "pidelo-admin-cambio";

export function leerClaveAdmin(): string {
  if (typeof window === "undefined") return "";
  return window.sessionStorage.getItem(CLAVE_SESION) ?? "";
}

function getSnapshot(): boolean {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(CLAVE_SESION) !== null;
}

function subscribe(callback: () => void): () => void {
  window.addEventListener(EVENTO, callback);
  return () => window.removeEventListener(EVENTO, callback);
}

export function GateAdmin({ children }: { children: ReactNode }) {
  const autorizado = useSyncExternalStore(subscribe, getSnapshot, () => false);
  const [clave, setClave] = useState("");
  const [error, setError] = useState<string | undefined>();

  if (autorizado) return <>{children}</>;

  function entrar() {
    if (clave !== CLAVE_ADMIN) {
      setError("Clave incorrecta.");
      return;
    }
    window.sessionStorage.setItem(CLAVE_SESION, clave);
    window.dispatchEvent(new Event(EVENTO));
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-sm flex-col items-center justify-center gap-4 px-5">
      <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
        <ShieldCheck className="size-7 text-primary" />
      </div>
      <h1 className="font-display text-h2 font-semibold text-ink">Panel del equipo</h1>
      <div className="w-full">
        <Input
          label="Clave de administrador"
          name="clave"
          type="password"
          placeholder="••••••••"
          value={clave}
          onChange={(e) => {
            setClave(e.target.value);
            setError(undefined);
          }}
          onKeyDown={(e) => e.key === "Enter" && entrar()}
          error={error}
        />
      </div>
      <Button fullWidth onClick={entrar}>
        Entrar
      </Button>
      {/* ⚠️ TEMPORAL: pista visible mientras no hay roles reales */}
      <p className="text-caption font-body text-muted">
        Demo: clave <span className="font-mono text-ink">admin123</span>
      </p>
    </div>
  );
}
