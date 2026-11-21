const nodemailer = require('nodemailer');

class MailService {
  constructor() {
    // Sin SMTP configurado, el correo solo se imprime en consola (útil en desarrollo).
    this.transporter = process.env.SMTP_HOST
      ? nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT) || 587,
          auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
        })
      : nodemailer.createTransport({ jsonTransport: true });
  }

  async enviarContacto({ nombre, email, telefono, mensaje }) {
    const info = await this.transporter.sendMail({
      from: process.env.SMTP_USER || 'no-reply@multicasa.local',
      to: process.env.CONTACT_TO || 'contacto@multicasa.com',
      replyTo: email,
      subject: `Contacto web: ${nombre}`,
      text: `Nombre: ${nombre}\nCorreo: ${email}\nTeléfono: ${telefono || '-'}\n\n${mensaje}`,
    });
    if (!process.env.SMTP_HOST) console.log('[MailService] (modo desarrollo) correo simulado:', info.message);
    return info;
  }
}

module.exports = MailService;
