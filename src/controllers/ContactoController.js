const MailService = require('../services/MailService');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

class ContactoController {
  constructor(mail = new MailService()) {
    this.mail = mail;
  }

  form = (req, res) => res.render('pages/contacto', { titulo: 'Contacto', datos: {} });

  enviar = async (req, res) => {
    const b = req.body || {};
    const datos = { nombre: (b.nombre || '').trim(), email: (b.email || '').trim(), telefono: (b.telefono || '').trim(), mensaje: (b.mensaje || '').trim() };

    if (!datos.nombre || !EMAIL_RE.test(datos.email) || datos.mensaje.length < 10) {
      res.locals.flash = { tipo: 'error', mensaje: 'Revisa los datos: nombre, correo válido y un mensaje de al menos 10 caracteres.' };
      return res.status(422).render('pages/contacto', { titulo: 'Contacto', datos });
    }
    try {
      await this.mail.enviarContacto(datos);
      req.session.flash = { tipo: 'ok', mensaje: '¡Gracias! Tu mensaje fue enviado.' };
    } catch (err) {
      console.error('Error enviando correo:', err.message);
      req.session.flash = { tipo: 'error', mensaje: 'No se pudo enviar el mensaje. Intenta más tarde.' };
    }
    return res.redirect('/contacto');
  };
}

module.exports = ContactoController;
