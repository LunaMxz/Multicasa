const router = require('express').Router();
const { requireAuth } = require('../middlewares/auth');
const { subirImagenes } = require('../middlewares/upload');
const { csrfToken, csrfVerificar: csrf } = require('../middlewares/csrf');
const { loginBloqueado } = require('../middlewares/loginLimiter');
const AuthController = require('../controllers/AuthController');
const AdminCasaController = require('../controllers/AdminCasaController');
const DashboardController = require('../controllers/DashboardController');

const auth = new AuthController();
const casas = new AdminCasaController();
const dashboard = new DashboardController();

// Todas las vistas de /admin usan el layout de administración y reciben `csrfToken`
router.use((req, res, next) => { res.locals.layout = 'layouts/admin'; next(); });
router.use(csrfToken);

// Zona pública del admin
router.get('/login', auth.loginForm);
router.post('/login', csrf, loginBloqueado, auth.login);
router.post('/logout', csrf, auth.logout);

// Zona privada
// Todo POST lleva `csrf` de forma explícita. En rutas multipart va DESPUÉS de multer,
// porque es multer quien lee el cuerpo (y el campo _csrf debe ser el primero del formulario).
router.use(requireAuth);
router.get('/', (req, res) => res.redirect('/admin/dashboard'));
router.get('/dashboard', dashboard.index);
router.get('/reporte.pdf', dashboard.reporte);

router.get('/casas', casas.index);
router.get('/casas/nueva', casas.nueva);
router.post('/casas', subirImagenes(), csrf, casas.crear);
router.get('/casas/:id/editar', casas.editar);
router.post('/casas/:id/editar', subirImagenes(), csrf, casas.actualizar);
router.post('/casas/:id/eliminar', csrf, casas.eliminar);
router.post('/casas/:id/imagenes/:imagenId/eliminar', csrf, casas.eliminarImagen);

module.exports = router;
