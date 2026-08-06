"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DEMO_SESSION_COOKIE } from "@/features/auth/demo-users";

// ⚠️ TEMPORAL: código fijo mientras no hay proveedor de SMS (Supabase + Twilio).
const CODIGO_DEMO = "1234";

export async function cerrarSesion(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(DEMO_SESSION_COOKIE);
  redirect("/");
}

export async function verificarCodigo(codigo: string): Promise<{ ok: boolean }> {
  if (codigo !== CODIGO_DEMO) {
    return { ok: false };
  }
  const cookieStore = await cookies();
  cookieStore.set(DEMO_SESSION_COOKIE, "cliente", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  return { ok: true };
}
