const nodemailer = require('nodemailer');

class MailService {
  constructor() {
    // La configuración ausente se informa como error; nunca simular un envío exitoso.
    this.transporter = process.env.SMTP_HOST
      ? nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT) || 587,
          secure: Number(process.env.SMTP_PORT) === 465,
          connectionTimeout: 10000,
          greetingTimeout: 10000,
          socketTimeout: 20000,
          auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
        })
      : null;
  }

  async enviarContacto({ nombre, email, telefono, mensaje }) {
    if (!this.transporter || !process.env.CONTACT_TO) {
      throw new Error('Configura SMTP_HOST y CONTACT_TO para enviar correo real.');
    }
    const info = await this.transporter.sendMail({
      from: process.env.SMTP_USER || 'no-reply@multicasa.local',
      to: process.env.CONTACT_TO || 'contacto@multicasa.com',
      replyTo: email,
      subject: `Contacto web: ${nombre}`,
      text: `Nombre: ${nombre}\nCorreo: ${email}\nTeléfono: ${telefono || '-'}\n\n${mensaje}`,
    });
    if (!info.accepted || info.accepted.length === 0) {
      throw new Error('El servidor SMTP no aceptó el destinatario.');
    }
    return info;
  }
}

module.exports = MailService;
