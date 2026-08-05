import type { ReactNode } from "react";

export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-6">
      <p className="font-display text-display font-bold text-primary">Pídelo</p>
      <h1 className="mt-4 font-display text-h2 font-semibold text-ink">{title}</h1>
      {subtitle && <p className="mt-1 text-body text-muted font-body">{subtitle}</p>}
      <div className="mt-6 flex flex-col gap-4">{children}</div>
      {footer && <div className="mt-6 text-center text-body font-body">{footer}</div>}
    </div>
  );
}
