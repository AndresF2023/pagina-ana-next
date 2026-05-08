# Tenis del 9

Plataforma web para entrenadores de tenis que centraliza la gestión de ejercicios con video, perfiles de jugadores y planificación de entrenamientos.

**Producción:** [tenisdel9.vercel.app](https://tenisdel9.vercel.app)

---

## Descripción

Tenis del 9 es una aplicación privada (requiere login) pensada para que un entrenador tenga todo su material de trabajo en un solo lugar:

- **Biblioteca de ejercicios** — videos de YouTube, Vimeo o archivos MP4 propios, organizados por categoría técnica, con indicaciones personalizadas por ejercicio
- **Gestión de jugadores** — perfiles con descripción, correcciones técnicas y calendario de torneos por jugador
- **Planificación de entrenamientos** — planes diarios, semanales y mensuales con título, fecha y contenido detallado

---

## Stack tecnológico

| Tecnología | Uso |
|---|---|
| **Next.js 16** (App Router) | Framework principal — Server Components, Server Actions, routing |
| **React 19** | UI, Client Components, `useTransition`, optimistic updates |
| **TypeScript 5** | Tipado estricto en todo el proyecto |
| **Tailwind CSS 4** | Estilos — paleta sky/slate, diseño responsive |
| **Supabase** | Base de datos PostgreSQL, autenticación y Storage para videos |
| **Vercel** | Deploy y hosting en producción |

---

## Funcionalidades detalladas

### Autenticación
- Middleware que protege todas las rutas privadas y redirige a `/login` si no hay sesión activa
- Login con email y contraseña vía Supabase Auth
- Manejo de cookies de sesión en servidor con `@supabase/ssr`

### Biblioteca de ejercicios
- Carga de video por URL (YouTube/Vimeo) o archivo MP4/MOV subido a Supabase Storage
- 7 categorías: Drive, Revés, Saque, Volea, Smash, Juego de pies, Otro
- Búsqueda por título y filtrado por categoría en tiempo real
- Indicaciones editables por ejercicio con guardado automático (debounce 450ms)
- Miniaturas automáticas para videos de YouTube

### Jugadores
- CRUD completo de jugadores
- Perfil editable: estilo de juego, nivel, fortalezas
- Correcciones técnicas editables por jugador
- Calendario de torneos: nombre, fecha y lugar — ordenados cronológicamente

### Planificación
- Planes diarios, semanales y mensuales
- Filtrado por tipo con tabs
- Contenido con preservación de formato (saltos de línea)
- Eliminación con actualización optimista en UI

---

## Patrones de implementación

- **Server Actions** para todo el CRUD — sin API routes intermedias
- **Revalidación de cache** con `revalidatePath()` tras cada mutación
- **Optimistic UI** en eliminación de torneos y planes
- **Debounce** en campos de guardado automático (notas, perfil, correcciones)
- Tipos centralizados en `lib/types.ts`

---

## Estructura del proyecto

```
├── app/
│   ├── (main)/                  # Rutas protegidas
│   │   ├── ejercicios/          # Biblioteca de ejercicios
│   │   ├── jugadores/           # Listado y detalle de jugadores
│   │   ├── planificacion/       # Planificación de entrenamientos
│   │   └── menu/                # Menú principal
│   └── login/                   # Autenticación
├── components/                  # Componentes reutilizables
├── lib/                         # Tipos, helpers, cliente Supabase
├── utils/supabase/              # Clientes Supabase (server/client)
└── middleware.ts                # Protección de rutas
```

---

## Variables de entorno

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

---

## Desarrollo local

```bash
npm install
npm run dev
```

Requiere un proyecto en [Supabase](https://supabase.com) con las tablas `exercises`, `jugadores`, `torneos` y `planificacion`.
