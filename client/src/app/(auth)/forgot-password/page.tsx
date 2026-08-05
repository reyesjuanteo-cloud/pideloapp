import Link from "next/link";
import { AuthCard } from "@/features/auth/auth-card";
import { ForgotPasswordForm } from "@/features/auth/forgot-password-form";

export const metadata = { title: "Recuperar contraseña — Pídelo" };

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Recupera tu contraseña"
      subtitle="Te enviamos un enlace a tu correo para crear una nueva."
      footer={
        <Link href="/login" className="text-primary font-semibold hover:text-primary-dark">
          Volver a iniciar sesión
        </Link>
      }
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}
