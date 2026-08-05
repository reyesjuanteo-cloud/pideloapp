import Link from "next/link";
import { AuthCard } from "@/features/auth/auth-card";
import { RegisterForm } from "@/features/auth/register-form";

export const metadata = { title: "Crear cuenta — Pídelo" };

export default function RegisterPage() {
  return (
    <AuthCard
      title="Crea tu cuenta"
      subtitle="Regístrate para empezar a pedir en Pídelo."
      footer={
        <>
          <span className="text-muted">¿Ya tienes cuenta? </span>
          <Link href="/login" className="text-primary font-semibold hover:text-primary-dark">
            Inicia sesión
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthCard>
  );
}
