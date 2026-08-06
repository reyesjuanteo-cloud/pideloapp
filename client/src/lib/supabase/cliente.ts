"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient, User } from "@supabase/supabase-js";

let instancia: SupabaseClient | null = null;

export function supabase(): SupabaseClient {
  if (!instancia) {
    instancia = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return instancia;
}

// Cada dispositivo obtiene una identidad real (sesión anónima) sin SMS.
// ⚠️ TEMPORAL: cuando haya proveedor de SMS, la sesión anónima se vincula
// al teléfono verificado (linkIdentity) sin perder datos.
export async function asegurarSesion(): Promise<User> {
  const sb = supabase();
  const {
    data: { session },
  } = await sb.auth.getSession();
  if (session) return session.user;

  const { data, error } = await sb.auth.signInAnonymously();
  if (error || !data.user) {
    throw new Error(`No se pudo crear la sesión: ${error?.message}`);
  }
  return data.user;
}
