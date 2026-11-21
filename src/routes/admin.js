const router = require('express').Router();
const { requireAuth } = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const AuthController = require('../controllers/AuthController');
const AdminCasaController = require('../controllers/AdminCasaController');
const DashboardController = require('../controllers/DashboardController');

const auth = new AuthController();
const casas = new AdminCasaController();
const dashboard = new DashboardController();

// Todas las vistas de /admin usan el layout de administración
router.use((req, res, next) => { res.locals.layout = 'layouts/admin'; next(); });

// Zona pública del admin
router.get('/login', auth.loginForm);
router.post('/login', auth.login);
router.post('/logout', auth.logout);

// Zona privada
router.use(requireAuth);
router.get('/', (req, res) => res.redirect('/admin/dashboard'));
router.get('/dashboard', dashboard.index);
router.get('/reporte.pdf', dashboard.reporte);

router.get('/casas', casas.index);
router.get('/casas/nueva', casas.nueva);
router.post('/casas', upload.array('imagenes', 8), casas.crear);
router.get('/casas/:id/editar', casas.editar);
router.post('/casas/:id/editar', upload.array('imagenes', 8), casas.actualizar);
router.post('/casas/:id/eliminar', casas.eliminar);
router.post('/casas/:id/imagenes/:imagenId/eliminar', casas.eliminarImagen);

module.exports = router;
