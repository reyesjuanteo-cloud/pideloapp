import type { ReactNode } from "react";

export function Chip({
  active,
  icon,
  onClick,
  children,
}: {
  active: boolean;
  icon?: ReactNode;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-11 items-center gap-1.5 rounded-full border px-3 py-1.5 text-caption font-semibold font-body transition-colors duration-300 ease-in-out ${
        active
          ? "border-primary bg-primary text-white"
          : "border-border bg-surface text-muted hover:text-ink"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}
