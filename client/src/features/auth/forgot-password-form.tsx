"use client";

import { useActionState } from "react";
import { Mail, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { requestPasswordReset, type ResetState } from "@/features/auth/actions";

const initialState: ResetState = { error: null, success: false };

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(requestPasswordReset, initialState);

  if (state.success) {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <CheckCircle2 className="size-8 text-success" />
        <p className="text-body font-body text-ink">
          Te enviamos un correo con instrucciones para restablecer tu contraseña.
        </p>
      </div>
    );
  }

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

      {state.error && <p className="text-caption text-error font-body">{state.error}</p>}

      <Button type="submit" fullWidth pending={pending}>
        Enviar instrucciones
      </Button>
    </form>
  );
}
