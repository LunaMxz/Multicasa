const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const { moneda } = require('../utils/format');

/** Motor de vistas (EJS + layouts) y variables disponibles en todas las vistas. */
module.exports = function configurarVistas(app) {
  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, '../views'));
  app.use(expressLayouts);
  app.set('layout', 'layouts/main');
  app.set('layout extractScripts', true);
  app.set('layout extractStyles', true);

  app.use((req, res, next) => {
    res.locals.usuario = (req.session && req.session.usuario) || null;
    res.locals.flash = (req.session && req.session.flash) || null;
    if (req.session) delete req.session.flash;
    res.locals.rutaActual = req.path;
    res.locals.titulo = 'Bienes Raíces Multicasa';
    res.locals.filtros = {};
    res.locals.moneda = moneda;
    next();
  });
};
