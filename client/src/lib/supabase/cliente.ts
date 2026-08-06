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

// La sesión guardada en el celular puede apuntar a un usuario que ya no
// existe (por ejemplo, si el equipo limpió los datos de prueba). Se valida
// una vez por carga: si está huérfana, se descarta y se crea una nueva.
let sesionValidada = false;

async function sesionUtilizable(sb: SupabaseClient): Promise<User | null> {
  const {
    data: { session },
  } = await sb.auth.getSession();
  if (!session) return null;
  if (sesionValidada) return session.user;

  const {
    data: { user },
    error,
  } = await sb.auth.getUser();
  if (user && !error) {
    sesionValidada = true;
    return user;
  }
  await sb.auth.signOut();
  return null;
}

// Cada dispositivo obtiene una identidad real (sesión anónima) sin SMS.
// ⚠️ TEMPORAL: cuando haya proveedor de SMS, la sesión anónima se vincula
// al teléfono verificado (linkIdentity) sin perder datos.
export async function asegurarSesion(): Promise<User> {
  const sb = supabase();
  const existente = await sesionUtilizable(sb);
  if (existente) return existente;

  const { data, error } = await sb.auth.signInAnonymously();
  if (error || !data.user) {
    throw new Error(`No se pudo crear la sesión: ${error?.message}`);
  }
  sesionValidada = true;
  return data.user;
}

// Descarta la sesión actual y crea una nueva. Se usa cuando la base rechaza
// una escritura porque el usuario ya no existe (violación de llave foránea).
export async function reiniciarSesion(): Promise<User> {
  const sb = supabase();
  sesionValidada = false;
  await sb.auth.signOut();
  return asegurarSesion();
}

// ¿El error viene de una sesión que apunta a un usuario borrado?
export function esSesionHuerfana(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return error.code === "23503" || Boolean(error.message?.includes("perfiles_id_fkey"));
}
