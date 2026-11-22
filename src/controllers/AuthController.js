const AuthService = require('../services/AuthService');
const limiter = require('../middlewares/loginLimiter');

class AuthController {
  constructor(service = new AuthService()) {
    this.service = service;
  }

  loginForm = (req, res) => {
    if (req.session.usuario) return res.redirect('/admin/dashboard');
    return res.render('admin/login', { titulo: 'Acceso administradores' });
  };

  login = async (req, res, next) => {
    const { email, password } = req.body || {};
    const usuario = await this.service.autenticar(email, password);
    if (!usuario) {
      limiter.registrarFallo(req);
      res.locals.flash = { tipo: 'error', mensaje: 'Correo o contraseña incorrectos.' };
      return res.status(401).render('admin/login', { titulo: 'Acceso administradores' });
    }
    limiter.limpiar(req);
    // regenerate() evita la fijación de sesión. Un error aquí va a next(), no se lanza
    // dentro del callback (un throw asíncrono tumbaría todo el proceso).
    return req.session.regenerate((err) => {
      if (err) return next(err);
      req.session.usuario = usuario;
      return res.redirect('/admin/dashboard');
    });
  };

  logout = (req, res, next) => {
    req.session.destroy((err) => (err ? next(err) : res.redirect('/')));
  };
}

module.exports = AuthController;
