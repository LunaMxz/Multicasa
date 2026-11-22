const crypto = require('crypto');

const METODOS_SEGUROS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Protección CSRF (patrón "synchronizer token"): un token aleatorio por sesión
 * se incrusta en cada formulario (`_csrf`) y se compara en cada POST.
 * Para formularios multipart debe ir DESPUÉS de multer (que es quien lee el body).
 */
function csrfToken(req, res, next) {
  if (!req.session.csrfToken) req.session.csrfToken = crypto.randomBytes(24).toString('hex');
  res.locals.csrfToken = req.session.csrfToken;
  next();
}

function csrfVerificar(req, res, next) {
  if (METODOS_SEGUROS.has(req.method)) return next();
  const esperado = req.session && req.session.csrfToken;
  const recibido = (req.body && req.body._csrf) || req.get('x-csrf-token');
  if (esperado && recibido) {
    const a = Buffer.from(String(esperado));
    const b = Buffer.from(String(recibido));
    if (a.length === b.length && crypto.timingSafeEqual(a, b)) return next();
  }
  const err = new Error('Token CSRF inválido o ausente. Recarga la página e inténtalo de nuevo.');
  err.status = 403;
  return next(err);
}

module.exports = { csrfToken, csrfVerificar };
