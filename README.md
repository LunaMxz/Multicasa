# Bienes Raíces Multicasa

Node.js · Express · Sequelize · PostgreSQL · Tailwind CSS · EJS (arquitectura MVC + capas Service y Repository)

## Arranque rápido
```bash
npm install
cp .env.example .env          # edita DB_* y SESSION_SECRET
createdb multicasa            # o créala desde pgAdmin
npm run db:init               # tablas + admin + 6 casas de ejemplo
npm run dev                   # servidor + Tailwind en modo watch -> http://localhost:3000
```
Admin: `http://localhost:3000/admin/login` (credenciales en `.env`: `ADMIN_EMAIL` / `ADMIN_PASSWORD`).
`npm run db:reset` borra y recrea todo. `npm run build:css` genera el CSS minificado.

## Estructura
```
src/
  config/        database.js (Singleton), views.js
  models/        Casa, ImagenCasa, Usuario
  repositories/  acceso a datos (patrón Repository)
  services/      lógica: CasaService, AuthService, ImageService, PdfService, MailService
  controllers/   clases (POO): Home, Casa, Contacto, Auth, AdminCasa, Dashboard, ApiCasa
  routes/        web.js · admin.js · api.js
  middlewares/   auth.js, upload.js
  views/         layouts/ partials/ pages/ admin/   <-- aquí se completa el PSD
public/          css, js, img, media (video y audio)
db/schema.sql    modelo físico
docs/            plantillas de los 7 entregables
```

## Qué falta completar (marcado con `TODO(PSD)` en las vistas)
- `partials/header.ejs`, `sidebar.ejs`, `footer.ejs`: ajustar al diseño exacto.
- `pages/home.ejs`, `casa-detalle.ejs`, `compania`, `servicios`, `requisitos`: textos reales y detalles visuales.
- Colores en `tailwind.config.js`; logo e íconos reales (los de `public/img` son recortes de baja resolución del mockup).
- Poner `public/media/multicasa.mp4` (2–4 min) y `public/media/consejos.mp3`.

## Rutas
| Zona | Rutas |
|---|---|
| Pública | `/`, `/casas`, `/casas/:id`, `/casas/:id/ficha.pdf`, `/compania`, `/servicios`, `/requisitos`, `/video`, `/contacto` |
| Admin | `/admin/login`, `/admin/dashboard`, `/admin/casas`, `/admin/casas/nueva`, `/admin/casas/:id/editar`, `/admin/reporte.pdf` |
| API REST | `GET /api/casas`, `GET /api/casas/:id`; con sesión de admin: `POST/PUT/DELETE /api/casas`, `GET /api/estadisticas` |

## Reparto sugerido (4 personas)
1. **Frontend:** `views/layouts`, `partials`, `pages/*`, `tailwind.config.js`, `public/img`.
2. **Backend:** `controllers/`, `routes/`, `middlewares/`, `AuthService`, `AdminCasaController`, API.
3. **Datos y búsqueda:** `models/`, `repositories/`, `CasaService`, `database/init.js`, mapa y dashboard.
4. **Calidad y documentación:** `docs/` (Gantt primero), `PdfService`, `MailService`, video/audio, pruebas, despliegue.

## Notas
- Sesiones en memoria (`MemoryStore`): suficiente para el proyecto; en producción usar `connect-pg-simple`.
- Sin SMTP configurado, el correo de contacto solo se imprime en consola.
- Usa Git: rama `main`, `develop` y una rama por persona.
