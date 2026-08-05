"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Mail, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { login, type AuthState } from "@/features/auth/actions";

const initialState: AuthState = { error: null };

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Input
        label="Correo"
        name="email"
        type="email"
        placeholder="tucorreo@ejemplo.com"
        icon={<Mail className="size-4" />}
        autoComplete="email"
        required
      />
      <Input
        label="Contraseña"
        name="password"
        type="password"
        placeholder="••••••••"
        icon={<Lock className="size-4" />}
        autoComplete="current-password"
        required
      />

      <div className="flex justify-end">
        <Link
          href="/forgot-password"
          className="text-caption font-body text-primary hover:text-primary-dark"
        >
          ¿Olvidaste tu contraseña?
        </Link>
      </div>

      {state.error && <p className="text-caption text-error font-body">{state.error}</p>}

      <Button type="submit" fullWidth pending={pending}>
        Iniciar sesión
      </Button>
    </form>
  );
}
