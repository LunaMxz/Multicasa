// Ejecutar: node --test docs/verificar-alondra.cjs
// No usa la BD, no envía correo real y solo escribe muestras en el directorio temporal.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { PassThrough } = require('node:stream');
const { finished } = require('node:stream/promises');
const sharp = require('sharp');
const MailService = require('../src/services/MailService');
const ContactoController = require('../src/controllers/ContactoController');
const PdfService = require('../src/services/PdfService');
const validos = { nombre: 'Prueba Alondra', email: 'prueba@example.com', telefono: '', mensaje: 'Consulta de prueba sobre una casa.' };

function respuesta() {
  return { locals: {}, codigo: 200,
    status(codigo) { this.codigo = codigo; return this; },
    render(vista, datos) { this.vista = vista; this.datos = datos; return this; },
    redirect(url) { this.url = url; return this; }
  };
}

test('contacto rechaza objetos, campos faltantes y límites sin invocar el correo', async () => {
  const controller = new ContactoController({ enviarContacto() { assert.fail('No debe enviar'); } });
  for (const cambios of [{ nombre: {} }, { email: [] }, { mensaje: 123 }, { nombre: '' }, { email: 'invalido' }, { mensaje: 'corto' }, { mensaje: 'x'.repeat(5001) }, { nombre: 'x'.repeat(101) }, { telefono: '1'.repeat(31) }, { nombre: 'Nombre\nCabecera' }]) {
    const res = respuesta();
    await controller.enviar({ body: { ...validos, ...cambios }, session: {} }, res);
    assert.equal(res.codigo, 422);
  }
});

test('contacto válido entrega los datos al servicio y redirige', async () => {
  let enviado;
  const controller = new ContactoController({ async enviarContacto(datos) { enviado = datos; } });
  const req = { body: { ...validos, nombre: '  Prueba Alondra  ' }, session: {} };
  const res = respuesta();
  await controller.enviar(req, res);
  assert.deepEqual(enviado, validos);
  assert.equal(res.url, '/contacto');
  assert.equal(req.session.flash.tipo, 'ok');
});

test('fallo de correo devuelve 503 conservando el mensaje', async () => {
  const controller = new ContactoController({ async enviarContacto() { throw new Error('Fallo controlado de prueba'); } });
  const res = respuesta();
  await controller.enviar({ body: validos, session: {} }, res);
  assert.equal(res.codigo, 503);
  assert.equal(res.datos.datos.mensaje, validos.mensaje);
  assert.equal(res.locals.flash.tipo, 'error');
});

test('SMTP: sin configuración falla; 465 activa TLS; rechazo no cuenta como éxito', async () => {
  const claves = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'CONTACT_TO'];
  const anterior = Object.fromEntries(claves.map(k => [k, process.env[k]]));
  try {
    claves.forEach(k => delete process.env[k]);
    await assert.rejects(new MailService().enviarContacto(validos), /Configura/);
    Object.assign(process.env, { SMTP_HOST: 'smtp.example.com', SMTP_PORT: '465', SMTP_USER: 'sender@example.com', CONTACT_TO: 'dest@example.com' });
    const mail = new MailService();
    assert.equal(mail.transporter.options.secure, true);
    let payload;
    mail.transporter = { async sendMail(datos) { payload = datos; return { accepted: ['dest@example.com'] }; } };
    await mail.enviarContacto(validos);
    assert.equal(payload.replyTo, validos.email);
    assert.equal(payload.from, 'sender@example.com');
    assert.equal(payload.to, 'dest@example.com');
    mail.transporter = { async sendMail() { return { accepted: [], rejected: ['dest@example.com'] }; } };
    await assert.rejects(mail.enviarContacto(validos), /no aceptó/);
    process.env.SMTP_PORT = '587';
    assert.equal(new MailService().transporter.options.secure, false);
  } finally {
    for (const k of claves) anterior[k] === undefined ? delete process.env[k] : process.env[k] = anterior[k];
  }
});

test('PDF: ficha con/sin foto, foto ausente, texto largo y reportes vacío/extenso', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'multicasa-alondra-'));
  const foto = path.join(dir, 'foto.webp');
  await sharp(path.join(__dirname, '../public/img/hero_casa.png')).resize(900).webp().toFile(foto);
  const service = new PdfService({ rutaAbsoluta: ruta => ruta });
  const casa = { id: 1, titulo: 'Casa de prueba en Saltillo', precio: 2450000, recamaras: 3, banos: 2, ciudad: 'Saltillo', estado: 'Coahuila', cp: '25204', direccion: 'Calle de demostración 123', estatus: 'venta', descripcion: 'Propiedad de demostración. PDF generado con datos de prueba.', imagenPrincipal: () => null };
  async function guardar(nombre, generar) {
    const res = new PassThrough();
    const headers = {};
    res.setHeader = (k, v) => { headers[k] = v; };
    const chunks = [];
    res.on('data', c => chunks.push(c));
    const fin = finished(res);
    await generar(res);
    await fin;
    const bytes = Buffer.concat(chunks);
    assert.equal(headers['Content-Type'], 'application/pdf');
    assert.equal(bytes.subarray(0, 5).toString(), '%PDF-');
    assert.match(bytes.subarray(-30).toString(), /%%EOF/);
    await fs.writeFile(path.join(dir, nombre + '.pdf'), bytes);
  }
  await guardar('ficha-sin-foto', res => service.ficha(casa, res));
  await guardar('ficha-con-foto', res => service.ficha({ ...casa, imagenPrincipal: () => ({ ruta: foto }) }, res));
  await guardar('ficha-foto-ausente', res => service.ficha({ ...casa, imagenPrincipal: () => ({ ruta: path.join(dir, 'no-existe.webp') }) }, res));
  await guardar('ficha-texto-largo', res => service.ficha({ ...casa, descripcion: 'Descripción extensa de una propiedad para probar saltos de página. '.repeat(100) }, res));
  await guardar('reporte-vacio', res => service.reporte([], res));
  await guardar('reporte-extenso', res => service.reporte(Array.from({ length: 100 }, (_, i) => ({ ...casa, id: i + 1, titulo: i % 2 ? 'Título extenso de vivienda de demostración para comprobar el ancho de columna' : casa.titulo, estatus: i % 2 ? 'vendida' : 'venta' })), res));
  console.log('PDF de prueba para revisión visual:', dir);
});
