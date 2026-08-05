# Pídelo — Guía de estilos

Este documento es la referencia única de identidad visual del proyecto. Cualquier pantalla, componente o cambio nuevo debe usar estos valores en vez de definir colores o tipografías sueltas.

## Colores

```css
--color-primary: #0E5C56;       /* Petróleo — marca, botones principales, links activos */
--color-primary-dark: #0A4640;  /* Header, hover de primario */
--color-accent: #FF6A39;        /* Naranja chaleco — CTA, estado "en camino", elementos que piden acción */
--color-bg: #EEF0E9;            /* Fondo base de la app */
--color-surface: #FFFFFF;       /* Tarjetas, inputs, modales */
--color-ink: #16231F;           /* Texto principal */
--color-muted: #5B6660;         /* Texto secundario, metadatos */
--color-border: #D6DAD1;        /* Bordes y líneas divisorias */
--color-success: #2F9E44;       /* Domiciliario disponible, pedido entregado */
--color-error: #C1442E;         /* Errores de formulario, acciones destructivas */
```

### Reglas de uso

- El primario (petróleo) es para lo estructural: header, botones de confirmación, navegación activa.
- El acento (naranja) se reserva para lo que necesita atención inmediata: pedir, en camino, alertas suaves. No usarlo como color de fondo grande — es un color de acción, no decorativo.
- Nunca usar negro puro (#000) ni blanco puro para texto — usar `--color-ink` y `--color-bg`/`--color-surface`.
- Los estados del domiciliario y del pedido siempre usan `--color-success` (disponible/entregado) o `--color-accent` (en ruta/en camino), nunca colores nuevos.

## Tipografías

```css
--font-display: 'Space Grotesk', sans-serif;  /* Logo, títulos de sección, números grandes */
--font-body: 'Inter', sans-serif;             /* Todo el texto de interfaz: formularios, botones, párrafos */
--font-mono: 'IBM Plex Mono', monospace;      /* Códigos de pedido, horas, coordenadas, cualquier dato tabular */
```

Import (web):

```html
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@500&display=swap" rel="stylesheet">
```

### Escala tipográfica

| Token | Tamaño | Fuente | Uso |
|---|---|---|---|
| `--text-display` | 26px / 700 | display | Nombre de marca |
| `--text-h2` | 17px / 600 | display | Títulos de modal, nombre de comercio |
| `--text-h3` | 14px / 600 | display | Títulos de sección ("Domiciliarios de la zona") |
| `--text-body` | 13.5px / 400–500 | body | Texto de formularios, descripciones |
| `--text-label` | 11.5px / 600, uppercase | body | Etiquetas de campo |
| `--text-caption` | 10.5–12px / 400–500 | body | Metadatos, timestamps |
| `--text-mono` | 11px / 500 | mono | Códigos de pedido |

## Espaciado y forma

```css
--radius-sm: 9px;    /* botones, chips pequeños */
--radius-md: 12px;   /* inputs, tarjetas */
--radius-lg: 14px;   /* tarjetas de pedido/comercio */
--radius-xl: 20px;   /* modales */
--radius-2xl: 28px;  /* contenedor principal de la app */

--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
```

- Los bordes siempre son `1px solid var(--color-border)`, nunca sombras marcadas para separar tarjetas de fondo — la app se apoya en color de superficie + borde fino, no en sombras duras.
- El contenedor principal (frame de la app) sí lleva sombra suave para despegarse del fondo: `0 30px 60px rgba(0,0,0,0.35)`.

## Componentes

- **Botón primario**: fondo `--color-primary`, texto blanco, `--radius-md`, peso 600, 12px vertical / 0 horizontal (full width en formularios).
- **Botón de acento (CTA de pedir)**: fondo `--color-accent`, texto blanco, `--radius-sm`, usado solo en acciones puntuales dentro de una tarjeta (ej. "Pedir" en un comercio).
- **Chip / filtro**: radius circular (999px), borde `--color-border`, fondo blanco; estado activo con fondo `--color-primary` y texto blanco.
- **Tarjeta**: fondo `--color-surface`, borde `--color-border`, `--radius-lg`, padding `--space-3`.
- **Input**: fondo blanco, borde `--color-border`, `--radius-md`, ícono a la izquierda cuando aplica (de lucide-react), texto en `--font-body` 13.5px.
- **Barra de progreso de pedido (tracking)**: puntos conectados por línea, color `--color-primary` para pasos completados, `--color-border` para pendientes, punto animado en naranja (`--color-accent`) mientras el estado es "en camino".

## Iconografía

Usar la librería `lucide-react`, trazo simple (no iconos rellenos ni de otra librería), tamaño estándar 14–18px según contexto.

## Motion

- Transiciones de color/estado: `0.3s ease`, nunca más largas.
- El único elemento con animación continua es el punto de "en camino" en la barra de tracking (loop de ida y vuelta). No añadir animaciones decorativas adicionales.

## Qué no hacer

- No introducir colores nuevos fuera de esta paleta sin actualizar este documento primero.
- No mezclar otras fuentes (nada de fuentes por defecto del sistema como Arial/Helvetica en producción).
- No usar `border-radius: 0` ni esquinas totalmente cuadradas — la identidad de Pídelo es de esquinas suaves.
