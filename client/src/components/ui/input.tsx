import type { InputHTMLAttributes, ReactNode } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  icon?: ReactNode;
  error?: string;
};

export function Input({ label, icon, error, id, className = "", ...props }: InputProps) {
  const inputId = id ?? props.name;

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={inputId}
        className="text-label font-semibold uppercase tracking-wide text-muted font-body"
      >
        {label}
      </label>
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
            {icon}
          </span>
        )}
        <input
          id={inputId}
          className={`w-full rounded-md border bg-surface py-2.5 text-body font-body text-ink placeholder:text-muted transition-colors duration-300 ease-in-out focus:outline-none focus:border-primary ${
            icon ? "pl-10 pr-3" : "px-3"
          } ${error ? "border-error" : "border-border"} ${className}`}
          {...props}
        />
      </div>
      {error && <p className="text-caption text-error font-body">{error}</p>}
    </div>
  );
}
