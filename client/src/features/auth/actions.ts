"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { DEMO_USERS, DEMO_SESSION_COOKIE } from "@/features/auth/demo-users";

export type AuthState = { error: string | null };

export async function login(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Completa correo y contraseña." };
  }

  // ⚠️ TEMPORAL: acceso demo sin Supabase — ver demo-users.ts.
  const demoUser = DEMO_USERS.find(
    (u) => u.email === email && u.password === password
  );
  if (demoUser) {
    const cookieStore = await cookies();
    cookieStore.set(DEMO_SESSION_COOKIE, demoUser.role, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
    redirect(demoUser.home);
  }

  let supabase;
  try {
    supabase = await createClient();
  } catch {
    return {
      error:
        "Supabase aún no está configurado. Usa las credenciales demo que aparecen abajo.",
    };
  }
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "Correo o contraseña incorrectos." };
  }

  // TODO: redirigir según el rol (cliente/comercio/domiciliario) una vez exista esa tabla.
  redirect("/driver/dashboard");
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(DEMO_SESSION_COOKIE);
  redirect("/login");
}

export async function signup(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!email || !password || !confirmPassword) {
    return { error: "Completa todos los campos." };
  }
  if (password !== confirmPassword) {
    return { error: "Las contraseñas no coinciden." };
  }
  if (password.length < 8) {
    return { error: "La contraseña debe tener al menos 8 caracteres." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({ email, password });

  if (error) {
    return { error: error.message };
  }

  redirect("/login?registered=1");
}

export type ResetState = { error: string | null; success: boolean };

export async function requestPasswordReset(
  _prevState: ResetState,
  formData: FormData
): Promise<ResetState> {
  const email = formData.get("email") as string;

  if (!email) {
    return { error: "Ingresa tu correo.", success: false };
  }

  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/reset-password`,
  });

  if (error) {
    return { error: "No pudimos enviar el correo. Intenta de nuevo.", success: false };
  }

  return { error: null, success: true };
}
