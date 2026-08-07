import type { CapacitorConfig } from "@capacitor/cli";

// App nativa (iOS y Android) construida con Capacitor sobre la misma app web.
//
// La app carga PideloApp desde el servidor en vez de empaquetar los archivos:
// la app usa server actions y rutas de API de Next.js, que no funcionan en un
// paquete estático. La ventaja práctica: cada `git push` actualiza también las
// apps instaladas, sin pasar por revisión de tiendas.
//
// Lo que aporta el envoltorio nativo (y una web no puede dar):
//   · Notificaciones push al mensajero con la app cerrada
//   · GPS en segundo plano durante una entrega
//   · Cámara nativa para los documentos
const config: CapacitorConfig = {
  appId: "app.pidelo.pideloapp",
  appName: "PideloApp",
  webDir: "public",
  server: {
    url: "https://pideloapp.vercel.app",
    cleartext: false,
  },
  ios: {
    contentInset: "always",
  },
  android: {
    // El teclado no debe tapar los campos del registro
    webContentsDebuggingEnabled: false,
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
};

export default config;
