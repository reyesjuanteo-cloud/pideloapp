import type { MetadataRoute } from "next";

// Manifiesto PWA: hace la app instalable desde el navegador del celular
// ("Agregar a pantalla de inicio") con ícono, splash y pantalla completa.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PideloApp — Pide ahora, recíbelo en minutos",
    short_name: "PideloApp",
    description:
      "Domicilios en Girardot, Ricaurte y Flandes. Pide de tus comercios favoritos o escribe lo que sea y un mensajero lo consigue.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#e8380d",
    orientation: "portrait",
    lang: "es-CO",
    icons: [
      { src: "/icono-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icono-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icono-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
