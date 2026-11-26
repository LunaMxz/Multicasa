# 1. Análisis de requerimientos (−5 pts si no se entrega)

## Problema y objetivo

Multicasa requiere un catálogo web para consultar viviendas por ubicación y características, mostrar su información y contactar a la inmobiliaria. La administración necesita mantener las casas y sus fotografías, consultar estadísticas y exportar documentos.

## Usuarios y alcance

- Visitante: consultar el catálogo, filtrar viviendas, ver ubicación y fotos, descargar fichas, enviar consultas y reproducir multimedia.
- Administrador: iniciar sesión para administrar propiedades e imágenes, revisar estadísticas y generar el reporte de estatus.
- Fuera del alcance: pagos, contratación de créditos y compraventa en línea.

## Requisitos no funcionales

- Separación MVC con servicios y repositorios; persistencia PostgreSQL mediante Sequelize.
- Acceso administrativo protegido y validación de entradas; errores sin detalles internos.
- Diseño adaptable a móvil, tableta y escritorio, con etiquetas en formularios y controles de reproducción.
- Verificación en Chrome, Firefox, Edge y Safari, registrando versiones y evidencia real.
- Configuración mediante variables de entorno; secretos excluidos del repositorio.
- Instalación reproducible y siete documentos de entrega con evidencias verificables.

## Matriz de trazabilidad

Corte: 25/11/2026. Entregado por una integrante no equivale a prueba integral aprobada. Karla: terminada según confirmación de Alondra; Michelle y Erika: aportaciones recibidas en ese orden.

| # | Requisito del profesor | Pts | Dónde está en el proyecto | Responsable | Estado |
|---|---|---|---|---|---|
| 1 | Sitio acorde al PSD | 5 | src/views/**, tailwind.config.js | Karla | Terminado según Alondra (25/11); pendiente evidencia |
| 2 | Slider | 5 | src/views/pages/home.ejs | Karla | Terminado según Alondra (25/11); pendiente evidencia |
| 3 | Búsqueda de casas | 5 | partials/buscador.ejs, CasaRepository.buscar | Erika | Implementado/documentado; pendiente validación integral |
| 4 | Altas/bajas/cambios (solo admin) | 10 | AdminCasaController, routes/admin.js | Michelle | Implementado/documentado; pendiente validación integral |
| 5 | Autenticación (zona pública y privada) | 5 | AuthController, middlewares/auth.js | Michelle | Implementado/documentado; pendiente validación integral |
| 6 | Formulario de contacto por correo | 5 | ContactoController, MailService | Alondra | Servicio implementado; pendiente configurar SMTP y comprobar recepción |
| 7 | Responsivo | 5 | Clases Tailwind (sm/md/lg) | Karla | Terminado según Alondra (25/11); pendiente evidencia |
| 8 | Mapa de ubicación en búsquedas | 5 | pages/casas.ejs (Leaflet) | Erika | Implementado/documentado; pendiente validación integral |
| 9 | Imágenes por vivienda | 5 | ImageService, imagenes_casa | Erika / Michelle | Implementado/documentado; pendiente validación integral |
| 10 | Video 2–4 min | 5 | pages/video.ejs, public/media/ | Alondra | Reproductores implementados; pendientes grabaciones |
| 11 | PDF ficha técnica | 5 | PdfService.ficha | Alondra | Implementado/documentado; pendiente validación integral |
| 12 | Reporte de casas con estatus | 5 | PdfService.reporte | Alondra | Implementado/documentado; pendiente validación integral |
| 13 | Dashboard (rango de costo y vendidas/venta) | 5 | admin/dashboard.ejs, public/js/dashboard.js | Erika | Implementado/documentado; pendiente validación integral |
| 14 | Compatibilidad de navegadores | 5 | docs/05-pruebas.md | Alondra, con apoyo de todas | Pendiente ejecución en navegadores |
| 15 | Base de datos | 5 | db/schema.sql | Erika | Implementado/documentado; pendiente validación integral |
| 16 | ORM | 5 | Sequelize (src/models) | Erika | Implementado/documentado; pendiente validación integral |
| 17 | Patrón de diseño | 5 | Repository + Singleton | Michelle / Erika | Implementado/documentado; pendiente validación integral |
| 18 | API REST | 5 | routes/api.js | Michelle | Implementado/documentado; pendiente validación integral |
| 19 | Documentación | 5 | docs/ | Alondra, con aportaciones de todas | En consolidación; evidencias pendientes |

## Criterios de aceptación de Alondra

- Contacto: rechazar datos inválidos, conservar el mensaje ante un fallo y confirmar recepción real de una consulta de prueba. Aceptación SMTP no demuestra llegada a la bandeja.
- Ficha: generar PDF legible con datos, precio, estatus y foto cuando está disponible; seguir funcionando sin foto o con archivo inaccesible.
- Reporte: mostrar todas las casas, estatus y totales correctos; admitir catálogo vacío y varias páginas.
- Multimedia: video de 2 a 4 minutos, MP4 H.264 a 720p y audio MP3; reproducir ambos desde /video.
- Documentación: siete documentos, Gantt, pruebas con capturas e instalación comprobada en otra computadora antes de la entrega del 26/11/2026.
