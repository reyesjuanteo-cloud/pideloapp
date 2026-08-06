import type { ReactNode } from "react";

// Tonos semánticos según STYLE_GUIDE: primario para info, acento para alertas
// suaves, success/error para estados de pedido y fallos.
type BannerTone = "info" | "exito" | "advertencia" | "error";

const toneClasses: Record<BannerTone, string> = {
  info: "bg-primary/10 text-primary",
  exito: "bg-success/10 text-success",
  advertencia: "bg-accent/10 text-accent-deep",
  error: "bg-error/10 text-error",
};

export function Banner({
  tone,
  icon,
  children,
}: {
  tone: BannerTone;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div
      className={`flex items-center gap-2 rounded-md p-3 text-caption font-body ${toneClasses[tone]}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </div>
  );
}
