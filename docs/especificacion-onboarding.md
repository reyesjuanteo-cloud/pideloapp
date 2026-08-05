# PideloApp — Especificación de UI (flujo de entrada)

> **Nota del equipo (2026-08-05):** esta especificación define la *estructura, flujos,
> comportamiento y copy* del onboarding. En lo visual, **STYLE_GUIDE.md sigue siendo la
> fuente de verdad**: donde este documento pide Inter 400/500, Tabler Icons, bordes de
> 0.5px o colores propios, se implementa con los tokens, tipografías (Space Grotesk /
> Inter / IBM Plex Mono), lucide-react y radios del STYLE_GUIDE. El modo oscuro queda
> pendiente hasta que el STYLE_GUIDE defina tokens oscuros. El OTP por SMS está simulado
> (código `1234`) hasta configurar Supabase + proveedor de SMS.
>
> **Zona inicial (decisión del equipo, 2026-08-05):** aunque este documento dice Bogotá,
> la prueba piloto opera en **Girardot (Cundinamarca), Ricaurte y Flandes**. El centro y
> radio de cobertura viven en `client/src/components/ui/mapa-base.tsx` (`CENTRO_ZONA`,
> `RADIO_COBERTURA_KM`).

Contexto para implementación. Cubre las 6 pantallas del onboarding, desde el arranque
hasta el home. No incluye ficha de tienda, carrito, checkout ni seguimiento.

**Producto:** app de domicilios donde el usuario puede pedir de catálogo (comida,
mercado, farmacia, envíos) o escribir en lenguaje libre lo que necesita y un mensajero
lo consigue. Promesa central: entrega en minutos.
**Mercado inicial:** Bogotá, Colombia. Español. Moneda COP.
**Plataforma:** móvil primero (iOS + Android). Diseño base a 390 px de ancho.

---

## 1. Tokens de diseño

### Color

Marca (verde-teal, transmite frescura y rapidez sin caer en el naranja genérico de delivery):

| Token | Hex | Uso |
|---|---|---|
| `brand-900` | `#04342C` | Texto sobre fondos brand claros |
| `brand-800` | `#085041` | Estado presionado del botón primario |
| `brand-600` | `#0F6E56` | **Color primario.** Botones, splash, pin del mapa |
| `brand-400` | `#1D9E75` | Acentos, iconografía activa |
| `brand-100` | `#9FE1CB` | Texto secundario sobre splash |
| `brand-50` | `#E1F5EE` | Fondos de chips y estados sutiles |

Neutrales:

| Token | Hex claro | Hex oscuro | Uso |
|---|---|---|---|
| `surface-0` | `#F7F7F5` | `#141413` | Fondo de pantalla |
| `surface-1` | `#EFEFEC` | `#1F1F1E` | Tarjetas planas, campos, mapa base |
| `surface-2` | `#FFFFFF` | `#2A2A28` | Superficies elevadas, hojas inferiores |
| `border` | `#E3E3DF` | `#373734` | Hairlines de 0,5 px |
| `border-strong` | `#CFCFC9` | `#4A4A46` | Bordes de botones secundarios |
| `text-primary` | `#1A1A18` | `#F5F5F3` | Titulares y cuerpo |
| `text-secondary` | `#5F5F5A` | `#B4B2A9` | Apoyo, metadatos |
| `text-muted` | `#8A8A83` | `#85847E` | Placeholders, disclaimers |

Semánticos:

| Rol | Fondo | Texto/icono |
|---|---|---|
| Info | `#E6F1FB` | `#0C447C` |
| Éxito | `#EAF3DE` | `#3B6D11` |
| Advertencia | `#FAEEDA` | `#854F0B` |
| Error | `#FCEBEB` | `#A32D2D` |
| Enlace / acción | — | `#185FA5` |

**Modo oscuro es obligatorio.** Todo color se referencia por token, nunca hex directo
en componentes. El `brand-600` se mantiene igual en ambos modos.

### Tipografía

- Familia: Inter (fallback: SF Pro en iOS, Roboto en Android).
- Solo dos pesos: **400 regular** y **500 medium**. Nada de 600/700.
- Escala:

| Rol | Tamaño | Peso | Interlineado |
|---|---|---|---|
| Wordmark splash | 26 | 500 | 1.2 |
| Título de pantalla | 20 | 500 | 1.3 |
| Título de sección | 15 | 500 | 1.4 |
| Cuerpo | 14 | 400 | 1.6 |
| Cuerpo secundario | 13 | 400 | 1.6 |
| Metadato | 12 | 400 | 1.5 |
| Caption / legal | 11 | 400 | 1.5 |
| Nav inferior | 10 | 400 | 1.3 |

Mínimo absoluto 10 px, y solo en el nav. Todo en **mayúscula inicial de frase**, nunca
Title Case ni MAYÚSCULAS.

### Espaciado y forma

- Escala: 4 / 8 / 12 / 16 / 20 / 24 px. Padding horizontal de pantalla: **20 px**.
- Radios: `8px` controles y campos · `12px` tarjetas y hojas · `22px` marca de logo ·
  `50%` avatares.
- Bordes: `0.5px solid border`. Nunca 1 px.
- **Sin gradientes, sin sombras, sin blur.** Superficies planas. Única sombra permitida:
  el anillo de foco.
- Altura de control estándar: 48 px (botones), 44 px (campos de texto).
- Área táctil mínima: 44 × 44 px.

### Iconografía

Tabler Icons, variante **outline** únicamente. 16–20 px en línea, 34 px decorativo.
Nunca emoji en UI (la bandera del selector de país es la excepción).

---

## 2. Inventario de componentes

| Componente | Descripción | Estados |
|---|---|---|
| `ButtonPrimary` | Fondo `brand-600`, texto blanco 14/500, radio 8, altura 48, ancho completo | default, pressed (`brand-800`, scale 0.98), disabled (opacidad 0.45), loading (spinner, sin texto) |
| `ButtonSecondary` | Transparente, borde 0.5 `border-strong`, texto `text-primary` | default, pressed (`surface-1`), disabled |
| `ButtonSocial` | Igual a secondary + icono de marca a la izquierda, centrado | default, pressed, loading |
| `TextField` | Borde 0.5 `border`, radio 8, padding 11/12, altura 44 | default, focus (borde `#185FA5`), filled, error (borde `#A32D2D` + mensaje 12 px debajo), disabled |
| `PhoneField` | Selector de país (bandera + prefijo + chevron) adosado a un `TextField` | igual que TextField |
| `OtpInput` | 4 casillas iguales, radio 8, dígito 21/500, gap 9 | vacía, activa (borde acento + cursor), llena, error (borde rojo, shake), verificando |
| `Chip` | Etiqueta con icono opcional, radio 8, padding 8/13 | inactivo (borde 0.5), activo (fondo info, texto `#0C447C`) |
| `ListCard` | Fila con thumbnail 42×42, título 13/500, subtítulo 11, radio 12, borde 0.5 | default, pressed, cerrado (opacidad 0.5 + badge "Cerrado") |
| `CategoryTile` | Cuadro 52 px alto, `surface-1`, icono 21 px centrado, etiqueta 11 debajo | default, pressed |
| `Banner` | Fondo semántico, icono + texto, radio 8 o 12 | info, éxito, advertencia, error |
| `BottomSheet` | `surface-2`, borde superior 0.5, radio superior 12, padding 16/20/20 | — |
| `BottomNav` | 4 ítems, borde superior 0.5, icono 19 + etiqueta 10 | activo (`brand-600`), inactivo (`text-muted`) |
| `Avatar` | Círculo 34 px, fondo `brand-50`, iniciales 12/500 `brand-800` | con foto, con iniciales |

---

## 3. Pantallas

### 3.1 Splash

Ruta lógica: `/` (mientras se resuelve sesión y ubicación guardada).

- Fondo completo `brand-600`, sin barra de estado propia (contenido claro).
- Centro: cuadro 72×72, radio 22, fondo `rgba(255,255,255,0.15)`, icono `bolt` 38 px blanco.
- Debajo: wordmark "Pídelo" 26/500 blanco, letter-spacing -0.5 px.
- Debajo: "Lo que sea, en minutos" 13/400 en `brand-100`.
- Abajo, a 38 px del borde: 3 puntos de 6 px (1 blanco, 2 al 40%) como indicador de carga.

**Comportamiento:** duración = tiempo real de carga, con mínimo de 400 ms y máximo de
2 s. No prolongar artificialmente. Si el máximo se supera, mantener la pantalla y
mostrar un texto de reintento a los 6 s.

**Ramificación al salir:**
- Sesión válida + dirección guardada → Home (3.6)
- Sesión válida sin dirección → Mapa (3.4)
- Sin sesión → Permiso de ubicación (3.2)

---

### 3.2 Permiso de ubicación

- Fondo `surface-2`, padding 24/20.
- Bloque centrado verticalmente: círculo 76 px `bg-info`, icono `map-pin` 34 px `#185FA5`.
- Título 19/500: "¿Dónde entregamos?"
- Cuerpo 13/400 `text-secondary`, centrado, máx. 2 líneas:
  "Necesitamos tu ubicación para mostrarte solo lo que llega rápido a tu zona."
- Al pie, apilados con gap 9:
  1. `ButtonPrimary` con icono `current-location`: "Usar mi ubicación actual"
  2. `ButtonSecondary`: "Escribir la dirección"
  3. Caption 11 `text-muted`: "Solo la usamos mientras haces un pedido"

**Comportamiento:** esta pantalla es propia y va **antes** del diálogo nativo del
sistema. Solo al tocar el botón primario se dispara el permiso del SO.

**Estados:**
- Permiso denegado → no bloquear. Ir directo a búsqueda manual de dirección.
- Permiso denegado permanentemente → banner de advertencia con enlace a Ajustes.
- GPS activo pero sin señal → spinner en el botón, timeout a 8 s, caer a manual.

---

### 3.3 Ingreso / registro

Una sola pantalla para ambos casos: si el número existe se inicia sesión, si no, se crea
la cuenta. El usuario nunca elige entre "login" y "registro".

- Header: flecha atrás 20 px, sin título.
- Título 20/500: "Ingresa o crea tu cuenta"
- Subtítulo 13 `text-secondary`: "Te enviamos un código por SMS. Sin contraseñas."
- `PhoneField`: selector `+57` con bandera + campo. Placeholder `300 123 4567`.
  Formato automático mientras se escribe. Teclado numérico.
- `ButtonPrimary`: "Continuar" — deshabilitado hasta tener 10 dígitos válidos.
- Divisor con "o" centrado.
- `ButtonSocial` Google y `ButtonSocial` Apple (Apple obligatorio en iOS si hay social login).
- Al pie: enlace "Explorar sin cuenta" 13 en `#185FA5`, y caption legal 10/400 `text-muted`
  con enlaces a términos y política de datos (Ley 1581 de 2012, habeas data).

**Estados:** default, número inválido (error bajo el campo), enviando (botón en loading),
número bloqueado por exceso de intentos (banner de error con tiempo de espera).

---

### 3.4 Verificación de código

- Header: flecha atrás.
- Título 20/500: "Escribe el código"
- Subtítulo 13: "Lo enviamos al +57 300 123 4567." + enlace "Cambiar número".
- `OtpInput` de 4 casillas de 54 px de alto, gap 9, ancho flexible.
- Debajo, centrado 12: "Reenviar código en **0:24**" — cuenta regresiva de 30 s; al
  llegar a 0 se convierte en enlace activo "Reenviar código".
- `Banner` info: icono `message-2` + "Detectamos el SMS y lo llenamos solo".
- Al pie: `ButtonPrimary` "Verificar" (deshabilitado hasta 4 dígitos) y enlace
  "¿Problemas? Recibir llamada".

**Comportamiento:** autocompletado obligatorio — `autocomplete="one-time-code"` en iOS y
SMS Retriever API en Android. Verificar automáticamente al completar el cuarto dígito,
sin esperar a que toquen el botón.

**Estados:** vacío, parcial, completo, verificando, código incorrecto (casillas en rojo +
shake + mensaje), código expirado, sin intentos restantes.

**Límites:** máximo 3 reenvíos por número cada 30 minutos. Máximo 5 intentos de código
por sesión de verificación.

---

### 3.5 Confirmar dirección (mapa)

- Mapa a pantalla completa ocupando ~70% del alto. Estilo plano, sin relieve, con calles
  en `border` sobre `surface-1` y manzanas en `surface-2`.
- Sobre el mapa, flotando a 16 px del borde superior:
  - Botón circular 34 px `surface-2` con flecha atrás.
  - Campo de búsqueda: `surface-2`, borde 0.5, radio 8, icono `search` + texto de la
    dirección actual.
- Pin fijo al centro del mapa (el mapa se mueve, no el pin). Icono `map-pin-filled` 34 px
  `brand-600`, con elipse de sombra plana debajo de 10×4 al 30%.
- Tooltip sobre el pin: "Mueve el pin al punto exacto" — desaparece tras la primera
  interacción.
- Botón circular 36 px abajo a la derecha: `current-location` para recentrar.
- Hoja inferior fija: etiqueta "Entregar en" 11 `text-muted`, dirección 15/500,
  barrio y ciudad 12 `text-secondary`, y `ButtonPrimary` "Confirmar dirección".

**Geocodificación:** el buscador debe aceptar el formato colombiano (`Cra 13 #85-32`,
`Calle 100 con Autopista`, `Av. Suba #104-20`) y normalizar abreviaturas
(cra/kra/carrera, cll/calle, dg/diagonal, tv/transversal). No depender solo del
autocompletado de Google Places: muchas direcciones de Bogotá no resuelven bien.
Guardar siempre lat/lng del pin como fuente de verdad, no la cadena de texto.

**Estados:** cargando mapa (esqueleto plano), fuera de zona de cobertura (hoja inferior
en advertencia: "Todavía no llegamos a esta zona" + botón deshabilitado + enlace para
avisar cuando lleguen), sin conexión.

---

### 3.6 Detalles de la entrega

- Header: flecha atrás. Título 20/500: "Detalles de la entrega"
- Resumen de dirección: fila `surface-1`, radio 8, icono `map-pin` + dirección 13/500 +
  barrio 11, y enlace "Editar" a la derecha.
- Campo "Torre, apartamento u oficina" — obligatorio si el tipo de inmueble es conjunto
  o edificio. Placeholder: `Torre 2 — Apto 704`.
- Campo "Indicaciones para el mensajero" — textarea de 62 px, opcional.
  Placeholder: `Portería al lado del café, timbre 704`.
- Etiqueta: fila de 3 `Chip` — Casa (icono `home`), Trabajo (`briefcase`), Otra (`plus`).
  Selección única, "Casa" activo por defecto.
- Al pie: `ButtonPrimary` "Guardar y continuar".

**Estados:** default, campo obligatorio vacío al intentar continuar, guardando,
error de guardado.

---

### 3.7 Home

Padding horizontal 16 px. Orden vertical estricto:

1. **Header** — etiqueta "Entregar en" 11 `text-muted`; dirección 14/500 con icono
   `map-pin` `brand-400` y chevron (abre selector de direcciones guardadas). A la derecha,
   `Avatar` 34 px.
2. **Buscador** — `surface-1`, borde 0.5, radio 8, icono `search` + placeholder
   "Busca tiendas o productos". No es un campo real: navega a la pantalla de búsqueda.
3. **Tarjeta "Pide lo que sea"** — fondo info, radio 12, padding 14.
   Título 15/500 `#0C447C`, subtítulo 12 `#185FA5`
   ("Escríbelo y un mensajero lo consigue por ti"), y dentro una caja `surface-2` radio 8
   con texto de ejemplo rotativo en `text-muted` y flecha derecha.
   **Esta tarjeta va por encima de las categorías.** Es el diferenciador del producto.
4. **Categorías** — título de sección 13/500 "Categorías" + grid de 4 columnas con gap 8.
   Comida (`tools-kitchen-2`), Mercado (`shopping-cart`), Farmacia (`pill`),
   Envíos (`package`). Scroll horizontal si hay más de 8.
5. **Cerca de ti** — título "Cerca de ti · llega en 15 min" + lista de `ListCard`.
   Cada tarjeta: thumbnail 42 px con fondo semántico, nombre 13/500, y metadatos 11:
   rating con icono `star`, rango de minutos, costo de envío. **El rango de tiempo va en
   cada tarjeta**, no solo en el encabezado.
6. **Pedido en curso** (condicional) — banner de éxito, radio 12, con icono `motorbike`,
   nombre del mensajero, "Llega en 6 min · Pedido #4821" y chevron. Debe ser **sticky
   sobre el nav inferior** cuando hay un pedido activo, no una fila más del scroll.
7. **BottomNav** — Inicio (`home`), Buscar (`search`), Pedidos (`receipt`),
   Perfil (`user`).

**Estados:** cargando (esqueletos planos en cada bloque), sin tiendas cerca (estado vacío
con invitación a usar el pedido libre), fuera de horario, sin conexión.

---

## 4. Reglas transversales

- **Estados obligatorios en cada pantalla:** default, cargando, vacío, error, sin conexión.
  Ninguna pantalla se entrega sin los cinco.
- **Copy:** mayúscula inicial de frase, verbo primero en los botones, sin signos de
  admiración, sin "por favor", sin "exitosamente". Los errores dicen qué pasó y qué hacer,
  en una línea, sin prefijo "Error:".
- **Accesibilidad:** contraste AA mínimo, foco visible por teclado, área táctil 44 px,
  `prefers-reduced-motion` respetado, etiquetas ARIA en botones con solo icono.
- **Moneda:** formato `$2.900` (punto de miles, sin decimales, símbolo pegado).
- **Persistencia:** dirección y sesión sobreviven al cierre de la app. El splash nunca
  debe volver a pedir permisos ya concedidos.

---

## 5. Pendiente de especificar

Pantallas aún no diseñadas: ficha de tienda, carrito, checkout y métodos de pago,
seguimiento en mapa, flujo completo del pedido libre (cotización del mensajero y
aprobación del usuario), perfil e historial de pedidos.
