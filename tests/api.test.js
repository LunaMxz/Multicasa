const test = require('node:test');
const assert = require('node:assert/strict');
const { iniciar, Casa } = require('./helpers');
const { ImagenCasa } = require('../src/models');
const limiter = require('../src/middlewares/loginLimiter');

let ctx; let admin; let anonimo;
const body = (extra = {}) => ({ titulo: 'Casa API', descripcion: 'desc', precio: 1800000, recamaras: 3, banos: 2, ciudad: 'Saltillo', estado: 'Coahuila', cp: '25000', latitud: 25.4, longitud: -100.9, estatus: 'venta', ...extra });
const semilla = () => Casa.bulkCreate([
  { titulo: 'Venta barata', precio: 900000, recamaras: 2, banos: 1, ciudad: 'Torreón', estado: 'Coahuila', cp: '27000', estatus: 'venta' },
  { titulo: 'Venta cara', precio: 6000000, recamaras: 4, banos: 3, ciudad: 'Monterrey', estado: 'Nuevo León', cp: '64920', estatus: 'venta' },
  { titulo: 'Ya vendida', precio: 2000000, recamaras: 3, banos: 2, ciudad: 'Saltillo', estado: 'Coahuila', cp: '25000', estatus: 'vendida' },
]);

test.before(async () => { ctx = await iniciar(); });
test.after(async () => { await ctx.cerrar(); });
test.beforeEach(async () => {
  limiter.reiniciarTodo();
  await ImagenCasa.destroy({ where: {} }); await Casa.destroy({ where: {} });
  admin = await ctx.admin(); anonimo = ctx.cliente();
});

test('GET /api/casas (público): 200, estructura y solo casas en venta', async () => {
  await semilla();
  const r = await anonimo.get('/api/casas');
  assert.equal(r.status, 200); assert.match(r.headers.get('content-type'), /application\/json/);
  assert.equal(r.json.total, 2); assert.equal(r.json.pagina, 1); assert.equal(r.json.resultados.length, 2);
  assert.ok(r.json.resultados.every((c) => c.estatus === 'venta'));
});

test('GET /api/casas: filtros (ciudad, precio, recámaras) y paginación inválida no rompe', async () => {
  await semilla();
  assert.equal((await anonimo.get('/api/casas?q=monterrey')).json.total, 1);
  assert.equal((await anonimo.get('/api/casas?precioMax=1000000')).json.total, 1);
  assert.equal((await anonimo.get('/api/casas?recamaras=4')).json.total, 1);
  assert.equal((await anonimo.get('/api/casas?pagina=-5&precioMin=abc')).status, 200);
  assert.equal((await anonimo.get("/api/casas?q=%25%27%3B--")).status, 200, 'caracteres especiales (LIKE/SQL) no rompen');
});

test('GET /api/casas/:id: 200 con la casa; 404 si no existe o el id es inválido', async () => {
  const [a] = await semilla();
  const ok = await anonimo.get(`/api/casas/${a.id}`);
  assert.equal(ok.status, 200); assert.equal(ok.json.titulo, 'Venta barata'); assert.ok(Array.isArray(ok.json.imagenes));
  for (const id of ['999999', 'abc', '0', '-1']) {
    const r = await anonimo.get(`/api/casas/${id}`);
    assert.equal(r.status, 404, id); assert.equal(r.json.error, 'Casa no encontrada');
  }
});

test('sin sesión: POST, PUT, DELETE y /estadisticas → 401 JSON', async () => {
  const [a] = await semilla();
  const rs = [await anonimo.json('POST', '/api/casas', body()), await anonimo.json('PUT', `/api/casas/${a.id}`, body()), await anonimo.req('DELETE', `/api/casas/${a.id}`), await anonimo.get('/api/estadisticas')];
  for (const r of rs) { assert.equal(r.status, 401); assert.equal(r.json.error, 'No autorizado'); }
  assert.equal(await Casa.count(), 3);
});

test('POST /api/casas: 201 y devuelve la casa creada (persistida)', async () => {
  const r = await admin.json('POST', '/api/casas', body());
  assert.equal(r.status, 201); assert.ok(r.json.id); assert.equal(r.json.titulo, 'Casa API');
  assert.equal(await Casa.count(), 1);
});

test('POST /api/casas inválido: 422 con lista de errores', async () => {
  const r = await admin.json('POST', '/api/casas', body({ titulo: '', precio: -1, estatus: 'otra' }));
  assert.equal(r.status, 422); assert.ok(Array.isArray(r.json.errores) && r.json.errores.length >= 3);
  assert.equal(await Casa.count(), 0);
});

test('POST /api/casas sin cuerpo: 422 (no 500)', async () => {
  const r = await admin.req('POST', '/api/casas', { headers: { 'content-type': 'application/json' }, body: '{}' });
  assert.equal(r.status, 422);
});

test('POST/PUT con Content-Type distinto de JSON → 415 (defensa CSRF de la API)', async () => {
  const [a] = await semilla();
  const f = await admin.form('/api/casas', { titulo: 'x' });
  assert.equal(f.status, 415);
  const p = await admin.req('PUT', `/api/casas/${a.id}`, { headers: { 'content-type': 'text/plain' }, body: 'x' });
  assert.equal(p.status, 415);
  assert.equal(await Casa.count(), 3);
});

test('JSON mal formado: 400 en JSON (no HTML ni 500)', async () => {
  const r = await admin.json('POST', '/api/casas', null, '{malformado');
  assert.equal(r.status, 400); assert.equal(r.json.error, 'JSON mal formado');
});

test('cuerpo mayor a 100 KB: 413 en JSON', async () => {
  const r = await admin.json('POST', '/api/casas', body({ descripcion: 'x'.repeat(150 * 1024) }));
  assert.equal(r.status, 413); assert.ok(r.json.error);
});

test('PUT /api/casas/:id: 200 actualiza; 404 inexistente; 422 inválido', async () => {
  const [a] = await semilla();
  const ok = await admin.json('PUT', `/api/casas/${a.id}`, body({ titulo: 'Actualizada', precio: 777000 }));
  assert.equal(ok.status, 200); assert.equal(ok.json.titulo, 'Actualizada'); assert.equal(Number(ok.json.precio), 777000);
  assert.equal((await admin.json('PUT', '/api/casas/999999', body())).status, 404);
  const mal = await admin.json('PUT', `/api/casas/${a.id}`, body({ precio: 0 }));
  assert.equal(mal.status, 422);
  await a.reload(); assert.equal(a.titulo, 'Actualizada');
});

test('PUT con estatus inválido se rechaza (ya no se cambia en silencio a "venta")', async () => {
  const [, , vendida] = await semilla();
  const r = await admin.json('PUT', `/api/casas/${vendida.id}`, body({ estatus: 'vendido' }));
  assert.equal(r.status, 422);
  await vendida.reload(); assert.equal(vendida.estatus, 'vendida');
});

test('DELETE /api/casas/:id: 204 sin cuerpo; luego 404; inexistente 404', async () => {
  const [a] = await semilla();
  const r = await admin.req('DELETE', `/api/casas/${a.id}`);
  assert.equal(r.status, 204); assert.equal(r.texto, '');
  assert.equal((await anonimo.get(`/api/casas/${a.id}`)).status, 404);
  assert.equal((await admin.req('DELETE', `/api/casas/${a.id}`)).status, 404);
  assert.equal((await admin.req('DELETE', '/api/casas/abc')).status, 404);
});

test('GET /api/estadisticas (admin): 200 con estatus y rangos', async () => {
  await semilla();
  const r = await admin.get('/api/estadisticas');
  assert.equal(r.status, 200);
  assert.deepEqual(r.json.estatus, { venta: 2, vendida: 1 });
  assert.equal(r.json.porRango.length, 5);
  assert.equal(r.json.porRango.reduce((n, x) => n + x.total, 0), 3);
});

test('rutas inexistentes bajo /api: 404 en JSON', async () => {
  const r = await anonimo.get('/api/no-existe');
  assert.equal(r.status, 404); assert.equal(r.json.error, 'Ruta no encontrada');
});

test('error interno en la API: 500 JSON genérico, sin SQL ni stack', async () => {
  const CasaRepository = require('../src/repositories/CasaRepository');
  const original = CasaRepository.prototype.buscar;
  CasaRepository.prototype.buscar = async () => { throw new Error('SELECT secreto FROM tabla'); };
  const silencio = console.error; console.error = () => {};
  try {
    const r = await anonimo.get('/api/casas');
    assert.equal(r.status, 500); assert.equal(r.json.error, 'Error interno del servidor');
    assert.doesNotMatch(r.texto, /SELECT|secreto/);
  } finally { console.error = silencio; CasaRepository.prototype.buscar = original; }
});
