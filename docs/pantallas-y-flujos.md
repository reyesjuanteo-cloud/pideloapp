# Pídelo — Mapa de pantallas y flujos

Estado al 2026-08-05. Leyenda: ✅ funcional · 🎭 funcional con datos/servicios simulados (`TEMPORAL`) · 🕳️ pendiente.

## Los cuatro roles de la app

| Rol | Entrada | Pantallas |
|---|---|---|
| **Cliente** | `/` (splash) → `/bienvenida` → onboarding | home, buscar, comercio, carrito, checkout, seguimiento, pedido libre, pedidos, perfil |
| **Mensajero** | `/mensajero/registro` | registro, estado, panel de trabajo |
| **Equipo (admin)** | `/admin` (clave `admin123` 🎭) | resumen, comercios, mensajeros, pedidos |

---

## Flujo 1 — Onboarding del cliente

```mermaid
flowchart TD
    S["/ 🎭\nsplash: resuelve sesión"] -->|sin sesión| BV["/bienvenida ✅\nlanding con beneficios"]
    BV --> U["/ubicacion ✅\npermiso GPS propio"]
    BV -->|Ya tengo cuenta| I
    S -->|sesión sin dirección| M
    S -->|sesión + dirección| H["/home ✅"]
    U --> I["/ingreso ✅\nteléfono +57, sin contraseñas"]
    I -->|10 dígitos| C["/codigo 🎭\nOTP 4 dígitos (demo 1234)"]
    I -->|Explorar sin cuenta| H
    C --> M["/mapa ✅\nMapLibre real · pin fijo\ngeocodificación inversa\ncobertura Girardot/Ricaurte/Flandes"]
    M --> E["/entrega ✅\ntorre/apto · indicaciones\netiqueta Casa/Trabajo/Otra"]
    E --> H
```

Simulado: la sesión es una cookie demo (sin Supabase Auth) y el SMS no existe — el código correcto siempre es `1234`.

## Flujo 2 — Pedir (catálogo y libre)

```mermaid
flowchart TD
    H["/home ✅\nbuscador · categorías · cerca de ti\nbanner pedido en curso"] --> B["/buscar ✅\nfiltros + texto sin tildes"]
    H --> F["/comercio/[id] ✅\nproductos administrables\ncerrado = no deja pedir"]
    B --> F
    F --> K["/carrito ✅\ncantidades · subtotal + envío $5.000"]
    K --> CH["/checkout 🎭\ndirección · efectivo\n(tarjeta pendiente)"]
    H --> L["/pedido-libre ✅\ntexto libre · tarifa única $5.000"]
    CH --> P["/pedido/[id] 🎭\nmapa en vivo del mensajero (simulado)\ntracker 4 pasos\nbotón «Recibí mi pedido»"]
    L --> P
```

## Flujo 3 — El ciclo de un pedido (cliente ↔ mensajero)

```mermaid
stateDiagram-v2
    [*] --> buscando: cliente hace el pedido
    buscando --> preparando: mensajero acepta (−$1.000 de su saldo)
    preparando --> en_camino: mensajero "Ya recogí el pedido"
    en_camino --> llegue: mensajero "Ya llegué"
    llegue --> entregado: SOLO el cliente "Recibí mi pedido"
    entregado --> [*]: ganancia +$5.000 al mensajero
```

Hoy sincroniza entre pestañas del mismo navegador (localStorage + eventos). Con Supabase Realtime funcionará entre teléfonos.

## Flujo 4 — Mensajero

```mermaid
flowchart TD
    R["/mensajero/registro ✅\nnombre · cédula · celular · municipio\nmoto (placa ABC12D + licencia + SOAT) o bici"] --> ES["/mensajero/estado ✅\nen revisión / aprobado / rechazado"]
    ES -->|equipo aprueba en /admin/mensajeros| D["/driver/dashboard ✅\nsolo aprobados"]
    D --> D1["Saldo 🎭\n$5.000 inicial = 5 pedidos\nrecarga simulada"]
    D --> D2["Pedidos en tu zona ✅\naparecen en vivo al pedir un cliente"]
    D --> D3["Entrega activa ✅\nrecogiendo → en ruta → ya llegué"]
    D --> D4["Ganancias + historial ✅\nse llenan al confirmar el cliente"]
```

## Flujo 5 — Admin (el que todo)

```mermaid
flowchart LR
    A["/admin 🎭\nclave fija admin123"] --> A1["Resumen\nstats + alertas"]
    A --> A2["Comercios ✅\ncrear · abrir/cerrar · eliminar\nproductos con precios"]
    A --> A3["Mensajeros ✅\naprobar / rechazar"]
    A --> A4["Pedidos ✅\nmonitor + comisiones ($1.000 × pedido)"]
    A2 -.se refleja en vivo.-> APP["App del cliente"]
    A3 -.desbloquea.-> DRV["Panel del mensajero"]
```

---

## Reorganización de duplicados (hecha el 2026-08-05)

- **`/` ahora es el splash** (como pide el spec): resuelve la sesión y ramifica. Usuarios nuevos ven la **landing en `/bienvenida`** (reutilizada del diseño original) cuyos botones entran al onboarding por teléfono.
- **Eliminado el login por email** (`/login`, `/register`, `/forgot-password`): había dos sistemas de autenticación; queda solo el ingreso por teléfono. El cliente de Supabase (`lib/supabase/server.ts`) se conserva para la integración real.
- **Eliminado `/customer/dashboard`** y sus componentes: superado por `/home`. Se conservan `types.ts` y `mock-comercios.ts` (semilla del almacén de comercios).

## Decisiones pendientes del equipo

1. **Supabase**: todo el estado es localStorage de un solo navegador. Es el gran siguiente paso — el esquema ya está definido por los tipos (`mensajeros`, `comercios`, `productos`, `pedidos`, `direcciones`, `saldos`).
2. **SMS real** para el OTP (Supabase Auth + Twilio) y **fotos** (documentos del mensajero, productos) con Supabase Storage.
3. **Pagos**: solo efectivo; tarjeta y la recarga real del mensajero necesitan pasarela.
4. **Seguridad real**: los candados de driver/admin son del lado del cliente; con Supabase serán roles de verdad.
5. **Modo oscuro** (el spec lo exige; el STYLE_GUIDE aún no define tokens oscuros).
6. Notificaciones push y contacto cliente ↔ mensajero (llamada/chat), no diseñados.
