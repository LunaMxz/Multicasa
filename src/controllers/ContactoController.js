const MailService = require('../services/MailService');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

class ContactoController {
  constructor(mail = new MailService()) {
    this.mail = mail;
  }

  form = (req, res) => res.render('pages/contacto', { titulo: 'Contacto', datos: {} });

  enviar = async (req, res) => {
    const b = req.body || {};
    const campo = (valor) => typeof valor === 'string' ? valor.trim() : '';
    const datos = { nombre: campo(b.nombre), email: campo(b.email), telefono: campo(b.telefono), mensaje: campo(b.mensaje) };

    if (!datos.nombre || datos.nombre.length > 100 || !EMAIL_RE.test(datos.email) || datos.email.length > 254 || datos.telefono.length > 30 || datos.mensaje.length < 10 || datos.mensaje.length > 5000 || /[\r\n]/.test(datos.nombre + datos.email)) {
      res.locals.flash = { tipo: 'error', mensaje: 'Revisa los datos: nombre (máximo 100), correo válido, teléfono (máximo 30) y mensaje de 10 a 5000 caracteres.' };
      return res.status(422).render('pages/contacto', { titulo: 'Contacto', datos });
    }
    try {
      await this.mail.enviarContacto(datos);
      req.session.flash = { tipo: 'ok', mensaje: '¡Gracias! Tu mensaje fue enviado.' };
    } catch (err) {
      console.error('Error enviando correo:', err.message);
      res.locals.flash = { tipo: 'error', mensaje: 'No se pudo enviar el mensaje. Intenta más tarde.' };
      return res.status(503).render('pages/contacto', { titulo: 'Contacto', datos });
    }
    return res.redirect('/contacto');
  };
}

module.exports = ContactoController;
