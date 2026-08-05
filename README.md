# PideloApp 🛵

Aplicación en construcción por el equipo PideloApp.

## Estado

🚧 Proyecto en fase inicial.

## Stack

- **Frontend**: Next.js (App Router) en [`client/`](client/) — Tailwind v4, lucide-react, Supabase Auth.
- **Backend**: Supabase (Postgres + Auth), con Vercel como hosting del frontend.

Todo el código de la app vive dentro de `client/`. No crear otro proyecto frontend en la raíz del repo — si ya existe uno en tu copia local (por ejemplo un scaffold de Vite), bórralo y trabaja dentro de `client/` para evitar dos apps compitiendo.

Para correr el proyecto localmente:

```bash
cd client
npm install
npm run dev
```

Copia `client/.env.local.example` a `client/.env.local` y completa las credenciales del proyecto de Supabase.

## Identidad visual

Toda pantalla, componente o cambio de UI debe seguir la [Guía de estilos](STYLE_GUIDE.md) (colores, tipografías, espaciado, componentes). No definir colores o fuentes sueltas fuera de ese documento.

## Equipo

- [@reyesjuanteo-cloud](https://github.com/reyesjuanteo-cloud)
- [@alfarogarciajeisonstid-ship-it](https://github.com/alfarogarciajeisonstid-ship-it)

## Cómo empezar

```bash
git clone https://github.com/reyesjuanteo-cloud/pideloapp.git
cd pideloapp
```

## Flujo de trabajo

1. Antes de empezar a trabajar: `git pull`
2. Haz tus cambios y commits
3. Sube tus cambios: `git push`
