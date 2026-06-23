# Chiro Shimokawa

App web mobile-first para venta de planes alimenticios. Construida con React + Vite (frontend) y Express (API) sobre Supabase, desplegada en Vercel.

Pensada para nutricionista/cliente: el admin arma plantillas de planes (con comidas por día y semana), se las asigna a clientes, los clientes marcan comidas hechas día a día, registran medidas y envían resultados por WhatsApp.

## Stack

- **Frontend**: React 18, Vite 5, React Router DOM v6, Tailwind CSS, react-helmet-async
- **Backend**: Express 4, Helmet 7, express-rate-limit, express-slow-down, express-timeout-handler, zod, pino
- **DB/Auth/Storage**: Supabase (Postgres + Auth con Google OAuth)
- **Deploy**: Vercel (frontend estático + Express como serverless function)

## Features

### Cliente (mobile-first)

- Login con Google (Supabase OAuth)
- Landing con CTA a WhatsApp
- **Hoy**: lista de comidas del día con check-off, barra de progreso, badge "HECHO", banner de alerta 5 días antes del vencimiento
- **Historial**: adherencia 30 días, stats por día, filtros (cumplidos/incompletos), oculta días sin actividad
- **Cerrar periodo**: steppers para peso y grasa, delta vs última medición, envío a WhatsApp con mensaje pre-llenado (1 vez por plan)
- Modo claro/oscuro con toggle
- Animación de pasar de página 3D al navegar entre secciones
- PWA instalable (manifest + service worker)

### Admin (panel)

- Dashboard con contadores (activos/pendientes/vencidos/inactivos)
- **Usuarios**: lista con filtros, búsqueda, detalle con asignación de planes, gráfico de peso/grasa
- **Planes**: CRUD de plantillas con **semanas + días** configurables, slots editables con alimentos + porción (u/g/kg/ml), copiar semana, limpiar semana, alertas de cambios sin guardar, doble alerta al eliminar
- **Alimentos**: CRUD de catálogo propio (sin APIs externas)
- Dar de baja usuarios (estado `inactive` con modal de confirmación + reactivar)
- Eliminar planes con doble alerta (simple si no hay usuarios, con conteo + última confirmación si hay)

## Estructura

```
/
├── api/                          # Backend Express
│   ├── app.js                    # helmet, cors, rate-limit, timeout
│   ├── index.js                  # Vercel handler (default export)
│   ├── server.js                 # dev (listen)
│   ├── config/                   # env + supabase admin client
│   ├── middleware/               # auth, adminOnly, validate, timeout, errorHandler, rateLimit
│   ├── routes/                   # users, foods, plans, metrics
│   ├── schemas/                  # zod validation
│   └── utils/                    # logger, whatsapp, auth
│
├── src/                          # Frontend React
│   ├── main.jsx, router.jsx
│   ├── pages/                    # Landing, auth/, user/ (Today, History, Close), admin/ (5 pages)
│   ├── components/               # layout/ (User, Admin), ui/, user/, admin/, icons.jsx
│   ├── hooks/                    # useAuth, useUserPlan, useBodyMetrics, useTheme, useAudit
│   ├── lib/                      # supabase, api, whatsapp, date, constants
│   └── styles/index.css          # Tailwind + custom (light theme, book-turn animation)
│
├── public/                       # robots, sitemap, manifest, favicon, service worker
├── vercel.json                   # rewrites + security headers
├── .env.example                  # variables (sin valores)
├── .gitignore                    # node_modules, dist, .env, supabase/, opencode/
├── vite.config.js, tailwind.config.js, postcss.config.js
└── README.md
```

## Setup local

### 1. Instalar deps
```bash
npm install
```

### 2. Variables de entorno
```bash
cp .env.example .env
```
Llenar las variables (ver sección **Variables de entorno** abajo).

### 3. Levantar (frontend + API en paralelo)
```bash
npm run dev:all
```
- Frontend: `http://localhost:5173`
- API: `http://localhost:3001`

O por separado:
```bash
npm run dev        # solo Vite (frontend)
npm run api:dev    # solo Express (API)
```

### 4. Indicador en la UI
- `/admin/foods` muestra `● API` (verde) o `● API off` (rojo) según el estado del backend
- Si ves "API off" → el server de Node no está corriendo

## Setup de Supabase

### 1. Crear proyecto en Supabase
- https://supabase.com/dashboard
- Crear proyecto nuevo (o usar uno existente)
- Anotar: URL, anon key, service_role key, JWT secret

### 2. Aplicar migraciones SQL
- SQL Editor → New query → pegar contenido de `0001_initial.sql` → Run
- Repetir para `0002_multiple_foods_per_slot.sql`, `0003_food_portions.sql`, `0004_fix_user_rls.sql`, `0005_weekly_plan.sql`, `0006_allow_plan_deletion.sql`, `0007_inactive_status.sql`
- **Importante**: si no corrés las migraciones en orden, el schema puede quedar inconsistente. Recomendado: crear un script de Supabase CLI que las corra todas en secuencia.

> ⚠️ Por convención de este proyecto, las migraciones **no se commitean a git** (la carpeta `supabase/` está en `.gitignore`). Se corren manualmente en el dashboard. Si tu equipo prefiere trackearlas, remové `supabase/` del `.gitignore`.

### 3. Habilitar Google OAuth
- Authentication → Providers → Google → Enable
- Authorized redirect URLs (agregar ambas):
  ```
  http://localhost:5173/auth/callback
  https://tu-dominio.vercel.app/auth/callback
  ```
- Authentication → URL Configuration:
  - Site URL: `http://localhost:5173` (en prod: tu dominio)
  - Additional redirect URLs: las mismas de arriba

### 4. (Opcional) SMTP
- Authentication → SMTP Settings → configurar SMTP custom
- Si no se configura, Supabase usa el SMTP built-in (limitado a 3 emails/hora en plan free)

## Setup del primer admin

Después de loguearte con Google:

```sql
update public.profiles
set role = 'admin'
where email = 'tu@gmail.com';
```

Logout, volvé a loguearte, y `/admin` debería estar accesible.

## Variables de entorno

### Frontend (prefijo `VITE_`, expuesto al cliente)

| Var | Ejemplo | Descripción |
|---|---|---|
| `VITE_SUPABASE_URL` | `https://xxx.supabase.co` | URL del proyecto |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_xxx` | Publishable key (nuevo formato) |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGc...` | Anon JWT (legacy, fallback) |
| `VITE_WHATSAPP_NUMBER` | `51905679279` | Número con prefijo país (51=Perú) |
| `VITE_WHATSAPP_ACQUIRE_MESSAGE` | `Hola Chiro Shimokawa, quiero adquirir un plan...` | Mensaje inicial |
| `VITE_WHATSAPP_RENEW_MESSAGE` | `Hola Chiro Shimokawa, quiero renovar...` | Mensaje de renovación |
| `VITE_WHATSAPP_CLOSE_MESSAGE` | `Hola Chiro Shimokawa, cerré mi período. Peso: {weight}kg...` | Template con placeholders `{weight}`, `{fat}`, `{note}` |
| `VITE_PUBLIC_URL` | `http://localhost:5173` | URL pública (usada en CORS y vercel.json) |

### Backend (server-side only, NUNCA con prefijo `VITE_`)

| Var | Descripción |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key. Bypasa RLS. **CRÍTICO**: rotar si se expuso. |
| `SUPABASE_JWT_SECRET` | Para verificar JWTs en la API |

### Runtime

| Var | Default | Descripción |
|---|---|---|
| `NODE_ENV` | `development` | `production` en Vercel |
| `RATE_LIMIT_WINDOW_MS` | `60000` | Ventana de rate limit (ms) |
| `RATE_LIMIT_MAX` | `100` | Max requests por ventana global |
| `REQUEST_TIMEOUT_MS` | `8000` | Timeout por request |

## Comandos

| Comando | Descripción |
|---|---|
| `npm run dev` | Vite dev server (frontend) |
| `npm run dev:all` | Frontend + API en paralelo (con concurrently) |
| `npm run api:dev` | Express dev server (backend) |
| `npm run build` | Build de producción (output en `dist/`) |
| `npm run preview` | Sirve el build de producción localmente |

## Deploy

### Vercel (recomendado)

1. Conectar el repo
2. Vercel detecta automáticamente Vite → build command: `npm run build`, output: `dist`
3. **Environment variables**: copiar todas las de `.env` en Vercel Dashboard → Project → Settings → Environment Variables
4. **Importante**: marcar `SUPABASE_SERVICE_ROLE_KEY` y `SUPABASE_JWT_SECRET` como "Production" (no Preview) para evitar leaks
5. Deploy automático en cada push a `main`

### vercel.json (ya incluido)

- Rewrites: `/api/*` → `api/index.js`, `/*` → `/index.html` (SPA fallback)
- Headers de seguridad: HSTS, X-Frame-Options DENY, X-Content-Type-Options nosniff, etc.
- Cache: `Cache-Control: public, max-age=31536000, immutable` para `.js`
- No-store para `/api/*`

## Esquema de base de datos

8 tablas + 1 audit log + helper function `is_admin()`:

```
profiles           (id, full_name, email, phone, role, status, plan_expires_at)
foods              (id, name, brand, fatsecret_id, description, image_url, category, nutrition)
plan_templates     (id, name, description, duration_days, price, is_active)
plan_items         (id, plan_template_id, slot_name, week_number, day_of_week, foods jsonb, notes, order_index)
user_plans         (id, user_id, plan_template_id, assigned_by, starts_at, expires_at, status, last_whatsapp_sent_at)
meal_logs          (id, user_id, user_plan_id, plan_item_id, log_date, completed, completed_at)
body_metrics       (id, user_id, recorded_at, weight_kg, body_fat_pct, note, sent_to_whatsapp_at)
admin_audit        (id, admin_id, action, target_user_id, target_plan_id, metadata)
```

**Enums**: `user_role` (user/admin), `user_status` (active/expired/pending/inactive), `plan_status` (active/completed/expired/cancelled)

**Triggers**:
- `on_auth_user_created` → crea fila en `profiles` automáticamente al signup

**Policies RLS** (todas las tablas):
- Users: SELECT/UPDATE own + admin all
- Foods/plan_templates/plan_items: solo admin
- User_plans: SELECT own + admin all
- Meal_logs: SELECT own + admin read all, INSERT/UPDATE own
- Body_metrics: SELECT own + admin read all, INSERT own
- Admin_audit: solo admin

**Helper function `is_admin()`**:
```sql
security definer, stable
returns boolean
-- checks profiles.role = 'admin' for current auth.uid()
```

## Seguridad

### Implementado
- ✅ RLS en todas las tablas
- ✅ `service_role` key NUNCA expuesta al cliente (prefijo `SUPABASE_` sin `VITE_`)
- ✅ Rate limit por ruta en Express (auth: 10/15min, write: 30/min, global: 100/min)
- ✅ Slow-down escalonado tras threshold
- ✅ Helmet con CSP estricto (script-src 'self', frame-ancestors 'none', etc.)
- ✅ HSTS (max-age 1 año, includeSubDomains, preload)
- ✅ HTTPS forzado en Vercel
- ✅ Request timeout 8s
- ✅ Body size limit 10kb
- ✅ Inputs validados con zod en backend
- ✅ CORS restringido a VITE_PUBLIC_URL
- ✅ JWT verification con `supabase.auth.getUser`
- ✅ `requireAuth` + `requireAdmin` middlewares
- ✅ Pino logger con redacción de Authorization headers
- ✅ `.gitignore` completo: node_modules, dist, .env, supabase/, opencode/, etc.
- ✅ Modo claro/oscuro con `prefers-color-scheme` (futuro)

### Pendientes
- Redis para rate limit en multi-instancia Vercel
- WAF externo (Cloudflare)
- 2FA para admin
- Auditoría visual (admin_audit ya existe, falta UI)
- Pen test formal

## Decisiones de diseño

- **Mobile-first**: todo el layout está pensado para 320-430px de ancho. Desktop es "aceptable" pero no optimizado.
- **Paleta**: amarillo `#F8F063` (CTAs/acento) sobre negro/blanco. Gris `#949494` para secundarios. Overrides via CSS variables para tema claro/oscuro.
- **Mobile-first responsive**: Tailwind sin `dark:` (se usa un único class system con overrides CSS).
- **Transición book-turn**: 3D `rotateY` con perspective 1800px en cada navegación.
- **Bottom nav flotante**: pill `rounded-full` con indicador deslizante y sombra.

## Skipped (intencional)

- ❌ FatSecret API — la usás solo si querés autocompletar. Se removió porque la API daba problemas y se decidió que el catálogo sea 100% propio del admin.
- ❌ SSR / Next.js — overkill para esta escala.
- ❌ Tests automatizados — smoke test manual. Add when: pidan CI/CD.
- ❌ Pagos online — la venta se cierra por WhatsApp manualmente.
- ❌ Notificaciones push — el usuario abre la app y ve el estado.
- ❌ i18n — solo español. Add when: pidan bilingüe (Shimokawa = japonés).

## Licencia

Privado / propietario. Todos los derechos reservados.
