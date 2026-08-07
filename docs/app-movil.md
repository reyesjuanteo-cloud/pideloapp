# PideloApp en iOS y Android

La app nativa envuelve la misma app web con **Capacitor**. No es un proyecto
aparte: es el mismo código, con acceso a lo que un navegador no puede dar.

## Por qué carga desde el servidor

`capacitor.config.ts` apunta a `https://pideloapp.vercel.app` en vez de
empaquetar los archivos. Razón técnica: la app usa server actions y rutas de
API de Next.js, que no existen en un paquete estático.

Efecto secundario muy bueno: **cada `git push` actualiza también las apps ya
instaladas**, sin esperar revisión de las tiendas. Solo hay que volver a
publicar cuando cambian permisos, íconos o plugins nativos.

## Lo que aporta lo nativo (y la web no puede)

| Capacidad | En la web | En la app |
|---|---|---|
| GPS del mensajero con pantalla apagada | se congela | sigue reportando |
| Avisar de un pedido con la app cerrada | imposible | notificación push |
| Cámara para documentos | del navegador | nativa, mejor calidad |
| Ícono en la pantalla de inicio | "agregar a inicio" | instalación normal |

## Requisitos para compilar

**Android** — falta instalar en este equipo:
1. [Android Studio](https://developer.android.com/studio) (trae el SDK y Java)
2. Abrir el proyecto: `npx cap open android`
3. Generar el AAB firmado: Build → Generate Signed Bundle
4. Subirlo a Google Play Console

**iOS** — Xcode ya está instalado; falta:
1. `sudo gem install cocoapods` y luego `npx cap sync ios`
2. `npx cap open ios`
3. En Xcode: elegir el equipo de desarrollo (la cuenta de Apple Developer)
4. Product → Archive → subir a App Store Connect

## Permisos ya configurados

- **iOS** (`ios/App/App/Info.plist`): ubicación en uso y en segundo plano,
  cámara, micrófono, y modos de fondo para ubicación y notificaciones.
- **Android** (`android/app/src/main/AndroidManifest.xml`): ubicación fina,
  gruesa y en segundo plano, cámara, micrófono y notificaciones.

Los textos de permiso de iOS están escritos en español y explican el porqué;
Apple rechaza los que no lo explican.

## Antes de publicar (pendiente)

- **Íconos y pantalla de arranque** nativos (hoy usan los de ejemplo).
- **Notificaciones push**: hay que crear el proyecto en Firebase (Android) y
  las llaves APNs (iOS), y conectar el envío desde el servidor.
- **GPS en segundo plano**: el plugin está instalado; falta activarlo en el
  panel del mensajero cuando corra dentro de la app nativa.
- **Revisión de Apple**: una app que solo muestra un sitio web puede ser
  rechazada (regla 4.2). Las funciones nativas de arriba son justamente lo que
  la diferencia — conviene que estén activas antes de enviarla.

## Probarla en tu iPhone sin esperar a Apple

**No necesitas la cuenta de desarrollador activada** para instalarla en tu
propio iPhone. Xcode lo permite con tu Apple ID normal (la app dura 7 días
instalada y se renueva volviéndola a instalar).

1. Conecta el iPhone al Mac con cable y desbloquéalo ("Confiar en este equipo").
2. `npx cap open ios` desde `client/`
3. En Xcode, panel izquierdo → **App** → pestaña **Signing & Capabilities**:
   - Marca **Automatically manage signing**
   - En **Team**, elige tu Apple ID (si no aparece: Xcode → Settings →
     Accounts → **+** → Apple ID)
4. Arriba, en el selector de dispositivo, elige **tu iPhone**.
5. Botón ▶︎ (Run).
6. La primera vez el iPhone bloquea la app: **Ajustes → General → VPN y
   gestión de dispositivos → confía en tu certificado de desarrollador**.

Ábrela y verás PideloApp como app nativa: pantalla completa, sin barra de
navegador, con su ícono.

### Si prefieres el simulador

Falta descargar la plataforma de iOS (varios GB): **Xcode → Settings →
Components → iOS** → instalar. Luego `npx cap run ios`.

Para probar de verdad conviene el iPhone físico: el simulador **no tiene GPS
real ni cámara**, que es justo lo que queremos verificar.
