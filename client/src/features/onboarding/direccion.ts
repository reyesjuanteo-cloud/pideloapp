// Persistencia local de la dirección de entrega. La fuente de verdad es el par
// lat/lng del pin, no la cadena de texto (ver docs/especificacion-onboarding.md).
export type Direccion = {
  texto: string;
  barrio: string;
  lat: number;
  lng: number;
  detalle?: string;
  indicaciones?: string;
  etiqueta?: "Casa" | "Trabajo" | "Otra";
};

const CLAVE = "pidelo-direccion";

export function leerDireccion(): Direccion | null {
  if (typeof window === "undefined") return null;
  try {
    const crudo = window.localStorage.getItem(CLAVE);
    return crudo ? (JSON.parse(crudo) as Direccion) : null;
  } catch {
    return null;
  }
}

export function guardarDireccion(direccion: Direccion): void {
  window.localStorage.setItem(CLAVE, JSON.stringify(direccion));
}
