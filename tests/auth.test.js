const test = require('node:test');
const assert = require('node:assert/strict');
const { iniciar, ADMIN, Usuario } = require('./helpers');
const AuthService = require('../src/services/AuthService');
const limiter = require('../src/middlewares/loginLimiter');

let ctx;
test.before(async () => { ctx = await iniciar(); });
test.after(async () => { await ctx.cerrar(); });
test.beforeEach(() => limiter.reiniciarTodo());

test('zona privada sin sesión redirige al login (GET)', async () => {
  const c = ctx.cliente();
  for (const url of ['/admin/casas', '/admin/casas/nueva', '/admin/casas/1/editar', '/admin/dashboard', '/admin/reporte.pdf', '/admin']) {
    const r = await c.get(url);
    assert.equal(r.status, 302, url);
    assert.equal(r.location, '/admin/login', url);
  }
});

test('zona privada sin sesión redirige al login (POST)', async () => {
  const c = ctx.cliente();
  for (const url of ['/admin/casas', '/admin/casas/1/editar', '/admin/casas/1/eliminar', '/admin/casas/1/imagenes/1/eliminar']) {
    const r = await c.form(url, {});
    assert.equal(r.status, 302, url);
    assert.equal(r.location, '/admin/login', url);
  }
});

test('login correcto: redirige al dashboard y da acceso', async () => {
  const c = ctx.cliente();
  const r = await c.login();
  assert.equal(r.status, 302);
  assert.equal(r.location, '/admin/dashboard');
  assert.equal((await c.get('/admin/casas')).status, 200);
  assert.equal((await c.get('/admin/dashboard')).status, 200);
});

test('login con contraseña incorrecta: 401 y mensaje genérico', async () => {
  const c = ctx.cliente();
  const r = await c.login(ADMIN.email, 'otra-contraseña');
  assert.equal(r.status, 401);
  assert.match(r.texto, /Correo o contraseña incorrectos/);
  assert.equal((await c.get('/admin/casas')).status, 302);
});

test('login con correo inexistente: misma respuesta que contraseña incorrecta (no revela usuarios)', async () => {
  const c = ctx.cliente();
  const r = await c.login('nadie@multicasa.com', ADMIN.password);
  assert.equal(r.status, 401);
  assert.match(r.texto, /Correo o contraseña incorrectos/);
});

test('login con tipos raros (arreglos/objetos) o vacío: 401, nunca 500', async () => {
  const c = ctx.cliente();
  const _csrf = await c.token();
  for (const body of [{ _csrf, 'email[]': 'a', password: 'x' }, { _csrf, email: ADMIN.email, 'password[x]': 'y' }, { _csrf }]) {
    const r = await c.form('/admin/login', body);
    assert.equal(r.status, 401, JSON.stringify(body));
  }
});

test('login sin token CSRF o con token falso: 403', async () => {
  const c = ctx.cliente();
  await c.get('/admin/login');
  assert.equal((await c.form('/admin/login', { email: ADMIN.email, password: ADMIN.password })).status, 403);
  assert.equal((await c.form('/admin/login', { _csrf: 'f'.repeat(48), email: ADMIN.email, password: ADMIN.password })).status, 403);
});

test('bloqueo por fuerza bruta: tras 5 fallos responde 429 aunque la contraseña sea correcta', async () => {
  const c = ctx.cliente();
  for (let i = 0; i < limiter.MAX_INTENTOS; i++) assert.equal((await c.login(ADMIN.email, 'mal' + i)).status, 401);
  const r = await c.login(ADMIN.email, ADMIN.password);
  assert.equal(r.status, 429);
  assert.match(r.texto, /Demasiados intentos/);
  // otro correo no queda bloqueado
  assert.equal((await ctx.cliente().login('otro@multicasa.com', 'x')).status, 401);
});

test('un login correcto reinicia el contador de fallos', async () => {
  const c = ctx.cliente();
  for (let i = 0; i < limiter.MAX_INTENTOS - 1; i++) await c.login(ADMIN.email, 'mal');
  assert.equal((await c.login()).status, 302);
  const c2 = ctx.cliente();
  for (let i = 0; i < limiter.MAX_INTENTOS - 1; i++) assert.equal((await c2.login(ADMIN.email, 'mal')).status, 401);
});

test('la sesión se regenera al iniciar sesión (anti fijación de sesión)', async () => {
  const c = ctx.cliente();
  await c.get('/admin/login');
  const antes = c.jar.get('multicasa.sid');
  assert.ok(antes);
  await c.login();
  assert.notEqual(c.jar.get('multicasa.sid'), antes);
});

test('una sesión fijada por un atacante no queda autenticada', async () => {
  const atacante = ctx.cliente();
  await atacante.get('/admin/login');
  const victima = ctx.cliente();
  victima.jar.set('multicasa.sid', atacante.jar.get('multicasa.sid')); // la víctima usa el id fijado
  await victima.login();
  assert.equal((await atacante.get('/admin/casas')).status, 302, 'el id viejo no debe dar acceso');
});

test('cookie de sesión: HttpOnly y SameSite=Lax', async () => {
  const r = await ctx.cliente().get('/admin/login');
  const sc = r.headers.getSetCookie().find((x) => x.startsWith('multicasa.sid'));
  assert.match(sc, /HttpOnly/i);
  assert.match(sc, /SameSite=Lax/i);
});

test('cabeceras de seguridad y sin x-powered-by', async () => {
  const r = await ctx.cliente().get('/admin/login');
  assert.equal(r.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(r.headers.get('x-frame-options'), 'SAMEORIGIN');
  assert.equal(r.headers.get('x-powered-by'), null);
});

test('logout: exige token CSRF y destruye la sesión', async () => {
  const c = await ctx.admin();
  assert.equal((await c.form('/admin/logout', {})).status, 403);
  assert.equal((await c.get('/admin/casas')).status, 200, 'sigue autenticada tras logout fallido');
  const _csrf = await c.token('/admin/casas');
  const r = await c.form('/admin/logout', { _csrf });
  assert.equal(r.status, 302);
  assert.equal((await c.get('/admin/casas')).status, 302);
});

test('la contraseña se guarda con bcrypt, nunca en texto plano', async () => {
  const u = await Usuario.findOne({ where: { email: ADMIN.email } });
  assert.match(u.passwordHash, /^\$2[aby]\$10\$/);
  assert.notEqual(u.passwordHash, ADMIN.password);
});

test('cambiarPassword: valida política, aplica el cambio e invalida la anterior', async () => {
  const svc = new AuthService();
  await assert.rejects(() => svc.cambiarPassword(ADMIN.email, 'corta1'), (e) => e.name === 'ValidationError');
  await assert.rejects(() => svc.cambiarPassword(ADMIN.email, 'solo-letras-largas'), (e) => e.name === 'ValidationError');
  await assert.rejects(() => svc.cambiarPassword('nadie@x.com', 'Nueva-Clave-2026'), (e) => e.name === 'ValidationError');
  await svc.cambiarPassword(ADMIN.email, 'Nueva-Clave-2026');
  assert.equal(await svc.autenticar(ADMIN.email, ADMIN.password), null);
  assert.ok(await svc.autenticar(ADMIN.email, 'Nueva-Clave-2026'));
  await svc.cambiarPassword(ADMIN.email, ADMIN.password); // restaurar para otras pruebas
});

test('autenticar normaliza el correo (mayúsculas/espacios)', async () => {
  assert.ok(await new AuthService().autenticar('  ADMIN@Multicasa.com ', ADMIN.password));
});
