const router = require('express').Router();
const { requireAuthApi } = require('../middlewares/auth');
const ApiCasaController = require('../controllers/ApiCasaController');
const { respuestaErrorApi } = require('../utils/errors');

const api = new ApiCasaController();

/**
 * Defensa CSRF para la API con sesión: POST/PUT solo aceptan application/json
 * (un formulario de otro sitio no puede enviarlo sin pasar por CORS, que no está habilitado).
 */
function exigirJson(req, res, next) {
  if (req.is('application/json')) return next();
  return res.status(415).json({ error: 'Content-Type debe ser application/json' });
}

// Públicas
router.get('/casas', api.list);
router.get('/casas/:id', api.show);

// Protegidas (requieren sesión de administrador)
router.post('/casas', requireAuthApi, exigirJson, api.create);
router.put('/casas/:id', requireAuthApi, exigirJson, api.update);
router.delete('/casas/:id', requireAuthApi, api.remove);
router.get('/estadisticas', requireAuthApi, api.estadisticas);

// Todo lo que no exista bajo /api responde JSON (no la página 404 HTML)
router.use((req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));

// Errores de la API siempre en JSON y sin filtrar detalles internos
// eslint-disable-next-line no-unused-vars
router.use((err, req, res, next) => {
  const { status, body } = respuestaErrorApi(err);
  if (status >= 500) console.error(err);
  return res.status(status).json(body);
});

module.exports = router;
