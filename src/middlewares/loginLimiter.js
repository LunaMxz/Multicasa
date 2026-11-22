/**
 * Limita intentos fallidos de login (fuerza bruta): MAX por ventana, por IP+correo.
 * En memoria: suficiente para el proyecto; en producción usar Redis/BD.
 */
const VENTANA_MS = 15 * 60 * 1000;
const MAX_INTENTOS = 5;
const intentos = new Map(); // clave -> { n, desde }

const clave = (req) => `${req.ip}|${String((req.body && req.body.email) || '').toLowerCase().trim()}`;

function vigente(reg) {
  return reg && Date.now() - reg.desde < VENTANA_MS;
}

function loginBloqueado(req, res, next) {
  const reg = intentos.get(clave(req));
  if (vigente(reg) && reg.n >= MAX_INTENTOS) {
    res.locals.flash = { tipo: 'error', mensaje: 'Demasiados intentos fallidos. Espera 15 minutos e inténtalo de nuevo.' };
    return res.status(429).render('admin/login', { titulo: 'Acceso administradores' });
  }
  return next();
}

function registrarFallo(req) {
  const k = clave(req);
  const reg = intentos.get(k);
  if (vigente(reg)) reg.n += 1; else intentos.set(k, { n: 1, desde: Date.now() });
}

function limpiar(req) {
  intentos.delete(clave(req));
}

function reiniciarTodo() { intentos.clear(); } // para pruebas

module.exports = { loginBloqueado, registrarFallo, limpiar, reiniciarTodo, MAX_INTENTOS };
