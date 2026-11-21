require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const configurarVistas = require('./config/views');

const app = express();

app.disable('x-powered-by');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// NOTA: MemoryStore sirve para desarrollo/escuela. En producción usa connect-pg-simple.
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-cambiar',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', maxAge: 1000 * 60 * 60 * 4 },
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
  console.error(err);
  res.status(err.status || 500).render('pages/error', { titulo: 'Error', mensaje: err.message });
});

module.exports = app;
