// Utilidades de prueba: servidor real en puerto libre + cliente HTTP con cookies (sin dependencias extra).
process.env.NODE_ENV = 'test';
// Las pruebas hacen sequelize.sync({ force: true }) (BORRAN las tablas): usan SIEMPRE una base aparte.
process.env.DB_NAME = process.env.DB_NAME_TEST || 'multicasa_test';
if (!/test/i.test(process.env.DB_NAME)) throw new Error(`Por seguridad la base de pruebas debe llevar "test" en el nombre (recibido: ${process.env.DB_NAME}).`);
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const app = require('../src/app');
const { sequelize, Casa, Usuario } = require('../src/models');
const AuthService = require('../src/services/AuthService');
const limiter = require('../src/middlewares/loginLimiter');

const ADMIN = { nombre: 'Admin Prueba', email: 'admin@multicasa.com', password: 'Admin-Prueba-2026' };
const DIR_IMG = path.join(__dirname, '../public/img/casas');

const archivosImg = () => fs.readdirSync(DIR_IMG).filter((f) => f.endsWith('.webp'));

class Cliente {
  constructor(base) { this.base = base; this.jar = new Map(); }

  cookieHeader() { return [...this.jar].map(([k, v]) => `${k}=${v}`).join('; '); }

  async req(method, url, { headers = {}, body } = {}) {
    const r = await fetch(this.base + url, { method, redirect: 'manual', body, headers: { ...headers, cookie: this.cookieHeader() } });
    for (const sc of r.headers.getSetCookie()) {
      const [par] = sc.split(';'); const i = par.indexOf('=');
      this.jar.set(par.slice(0, i), par.slice(i + 1));
    }
    const texto = await r.text();
    let json = null; try { json = JSON.parse(texto); } catch (_) { /* html */ }
    return { status: r.status, headers: r.headers, texto, json, location: r.headers.get('location') };
  }

  get(url) { return this.req('GET', url); }

  form(url, datos) {
    return this.req('POST', url, { headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(datos).toString() });
  }

  multipart(url, campos, archivos = []) {
    const fd = new FormData();
    for (const [k, v] of Object.entries(campos)) fd.append(k, v); // el _csrf debe ir primero en `campos`
    for (const a of archivos) fd.append('imagenes', new Blob([a.buffer], { type: a.type }), a.name);
    return this.req('POST', url, { body: fd });
  }

  json(method, url, obj, raw) {
    return this.req(method, url, { headers: { 'content-type': 'application/json' }, body: raw ?? JSON.stringify(obj) });
  }

  /** Obtiene el token CSRF vigente leyéndolo de una página que tenga formulario. */
  async token(url = '/admin/login') {
    const { texto } = await this.get(url);
    const m = texto.match(/name="_csrf" value="([0-9a-f]+)"/);
    return m ? m[1] : null;
  }

  async login(email = ADMIN.email, password = ADMIN.password) {
    const _csrf = await this.token('/admin/login');
    return this.form('/admin/login', { _csrf, email, password });
  }
}

async function iniciar() {
  await sequelize.sync({ force: true });
  await new AuthService().crearAdmin(ADMIN);
  limiter.reiniciarTodo();
  const server = await new Promise((ok) => { const s = app.listen(0, () => ok(s)); });
  const base = `http://127.0.0.1:${server.address().port}`;
  return {
    base,
    cliente: () => new Cliente(base),
    async admin() { const c = new Cliente(base); const r = await c.login(); if (r.status !== 302) throw new Error('login de prueba falló'); return c; },
    async cerrar() { await new Promise((ok) => server.close(ok)); await sequelize.close(); },
  };
}

const casaValida = (extra = {}) => ({
  titulo: 'Casa de prueba', descripcion: 'Descripción', precio: '1500000', recamaras: '3', banos: '2',
  ciudad: 'Saltillo', estado: 'Coahuila', cp: '25000', direccion: 'Calle 1', latitud: '25.42', longitud: '-100.97', estatus: 'venta', ...extra,
});

const png = (w = 64, h = 48) => sharp({ create: { width: w, height: h, channels: 3, background: '#3a7bb5' } }).png().toBuffer();

module.exports = { iniciar, ADMIN, casaValida, png, archivosImg, Casa, Usuario, sequelize };
