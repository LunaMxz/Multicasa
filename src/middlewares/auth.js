/** Zona privada (vistas): si no hay sesión, redirige al login. */
function requireAuth(req, res, next) {
  if (req.session && req.session.usuario) return next();
  req.session.flash = { tipo: 'error', mensaje: 'Inicia sesión para continuar.' };
  return res.redirect('/admin/login');
}

/** Zona privada (API): responde 401 en JSON. */
function requireAuthApi(req, res, next) {
  if (req.session && req.session.usuario) return next();
  return res.status(401).json({ error: 'No autorizado' });
}

module.exports = { requireAuth, requireAuthApi };
