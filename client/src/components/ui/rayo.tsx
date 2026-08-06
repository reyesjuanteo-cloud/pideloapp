// Rayo decorativo de la marca (el mismo motivo del logo), en degradado fuego.
// Uso: acentos sutiles en fondos blancos — posicionar con className.
export function Rayo({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <defs>
        <linearGradient id="rayo-fuego" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FF9800" />
          <stop offset="1" stopColor="#E8380D" />
        </linearGradient>
      </defs>
      <path
        d="M13 2 4.5 13.5h5L9.5 22 19 9.5h-5.5L13 2Z"
        fill="url(#rayo-fuego)"
        stroke="url(#rayo-fuego)"
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </svg>
  );
}
