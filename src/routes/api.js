const router = require('express').Router();
const { requireAuthApi } = require('../middlewares/auth');
const ApiCasaController = require('../controllers/ApiCasaController');
const { ValidationError } = require('../utils/errors');

const api = new ApiCasaController();

// Públicas
router.get('/casas', api.list);
router.get('/casas/:id', api.show);

// Protegidas (requieren sesión de administrador)
router.post('/casas', requireAuthApi, api.create);
router.put('/casas/:id', requireAuthApi, api.update);
router.delete('/casas/:id', requireAuthApi, api.remove);
router.get('/estadisticas', requireAuthApi, api.estadisticas);

// Errores de la API siempre en JSON
router.use((err, req, res, next) => {
  if (err instanceof ValidationError) return res.status(422).json({ errores: err.errores });
  console.error(err);
  return res.status(500).json({ error: 'Error interno del servidor' });
});

module.exports = router;
