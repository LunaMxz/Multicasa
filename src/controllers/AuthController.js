const AuthService = require('../services/AuthService');

class AuthController {
  constructor(service = new AuthService()) {
    this.service = service;
  }

  loginForm = (req, res) => {
    if (req.session.usuario) return res.redirect('/admin/dashboard');
    return res.render('admin/login', { titulo: 'Acceso administradores' });
  };

  login = async (req, res) => {
    const { email, password } = req.body || {};
    const usuario = await this.service.autenticar(email, password);
    if (!usuario) {
      res.locals.flash = { tipo: 'error', mensaje: 'Correo o contraseña incorrectos.' };
      return res.status(401).render('admin/login', { titulo: 'Acceso administradores' });
    }
    // regenerate() evita la fijación de sesión
    return req.session.regenerate((err) => {
      if (err) throw err;
      req.session.usuario = usuario;
      res.redirect('/admin/dashboard');
    });
  };

  logout = (req, res) => {
    req.session.destroy(() => res.redirect('/'));
  };
}

module.exports = AuthController;
