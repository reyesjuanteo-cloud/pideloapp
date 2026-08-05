"use client";

import { useActionState } from "react";
import { Mail, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { signup, type AuthState } from "@/features/auth/actions";

const initialState: AuthState = { error: null };

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(signup, initialState);

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
        placeholder="Mínimo 8 caracteres"
        icon={<Lock className="size-4" />}
        autoComplete="new-password"
        required
      />
      <Input
        label="Confirmar contraseña"
        name="confirmPassword"
        type="password"
        placeholder="Repite tu contraseña"
        icon={<Lock className="size-4" />}
        autoComplete="new-password"
        required
      />

      {state.error && <p className="text-caption text-error font-body">{state.error}</p>}

      <Button type="submit" fullWidth pending={pending}>
        Crear cuenta
      </Button>
    </form>
  );
}
