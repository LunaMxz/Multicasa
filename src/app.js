require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const configurarVistas = require('./config/views');
const securityHeaders = require('./middlewares/securityHeaders');
const { respuestaErrorApi } = require('./utils/errors');

const PRODUCCION = process.env.NODE_ENV === 'production';
const SECRET = process.env.SESSION_SECRET;
if (PRODUCCION && (!SECRET || SECRET.length < 32 || /cambia|dev-secret/i.test(SECRET))) {
  throw new Error('Define un SESSION_SECRET aleatorio de al menos 32 caracteres en producción.');
}

const app = express();

app.disable('x-powered-by');
if (PRODUCCION) app.set('trust proxy', 1); // detrás de un proxy (cookie "secure")
app.use(securityHeaders);
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));
app.use(express.static(path.join(__dirname, '../public')));

// NOTA: MemoryStore sirve para desarrollo/escuela. En producción usa connect-pg-simple.
app.use(session({
  name: 'multicasa.sid',
  secret: SECRET || 'dev-secret-cambiar',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', secure: PRODUCCION, maxAge: 1000 * 60 * 60 * 4 },
}));

configurarVistas(app);

app.use('/api', require('./routes/api'));
app.use('/admin', require('./routes/admin'));
app.use('/', require('./routes/web'));

// 404
app.use((req, res) => res.status(404).render('pages/404', { titulo: 'No encontrada' }));

// Errores
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  // Errores de /api que ocurren antes del router (p. ej. JSON mal formado) también salen en JSON
  if (req.originalUrl.startsWith('/api')) {
    const { status, body } = respuestaErrorApi(err);
    return res.status(status).json(body);
  }
  const status = Number.isInteger(err.status) && err.status >= 400 && err.status < 600 ? err.status : 500;
  if (status >= 500) console.error(err);
  // En 5xx no se muestra el mensaje interno (p. ej. SQL) al visitante
  const mensaje = status >= 500 ? 'Ocurrió un error interno. Inténtalo más tarde.' : err.message;
  res.status(status).render('pages/error', { titulo: 'Error', mensaje });
});

module.exports = app;
