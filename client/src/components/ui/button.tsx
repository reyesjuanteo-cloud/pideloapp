import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "accent";
  pending?: boolean;
  fullWidth?: boolean;
};

const variantClasses = {
  primary: "bg-primary text-white hover:bg-primary-dark rounded-md py-3",
  accent: "bg-accent text-white hover:brightness-95 rounded-sm py-2.5",
};

export function Button({
  variant = "primary",
  pending = false,
  fullWidth = false,
  className = "",
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 px-4 font-body text-body font-semibold transition-colors duration-300 ease-in-out disabled:opacity-60 disabled:cursor-not-allowed ${
        variantClasses[variant]
      } ${fullWidth ? "w-full" : ""} ${className}`}
      disabled={disabled || pending}
      {...props}
    >
      {pending && <Loader2 className="size-4 animate-spin" />}
      {children}
    </button>
  );
}
