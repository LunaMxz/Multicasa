const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { iniciar, casaValida, png, archivosImg, Casa, sequelize } = require('./helpers');
const { ImagenCasa } = require('../src/models');
const limiter = require('../src/middlewares/loginLimiter');

let ctx; let admin;
const crearCasa = async (extra = {}, archivos = []) => {
  const _csrf = await admin.token('/admin/casas/nueva');
  return admin.multipart('/admin/casas', { _csrf, ...casaValida(extra) }, archivos);
};
const imgOk = async (n = 'foto.png') => ({ buffer: await png(), type: 'image/png', name: n });

test.before(async () => { ctx = await iniciar(); });
test.after(async () => { await ctx.cerrar(); });
test.beforeEach(async () => {
  limiter.reiniciarTodo();
  await ImagenCasa.destroy({ where: {} }); await Casa.destroy({ where: {} });
  for (const f of archivosImg()) fs.unlinkSync(path.join(__dirname, '../public/img/casas', f));
  admin = await ctx.admin();
});

test('ALTA: crea una casa válida y la muestra en el listado', async () => {
  const r = await crearCasa();
  assert.equal(r.status, 302); assert.equal(r.location, '/admin/casas');
  const c = await Casa.findOne();
  assert.equal(c.titulo, 'Casa de prueba'); assert.equal(Number(c.precio), 1500000); assert.equal(c.estatus, 'venta');
  const lista = await admin.get('/admin/casas');
  assert.match(lista.texto, /Casa de prueba/); assert.match(lista.texto, /Casa creada correctamente/);
});

test('ALTA con fotos: se optimizan a WebP, la 1ª es principal, hay miniatura', async () => {
  const r = await crearCasa({}, [await imgOk('a.png'), await imgOk('b.png')]);
  assert.equal(r.status, 302);
  const imgs = await ImagenCasa.findAll({ order: [['id', 'ASC']] });
  assert.equal(imgs.length, 2);
  assert.deepEqual(imgs.map((i) => i.esPrincipal), [true, false]);
  for (const i of imgs) {
    assert.match(i.ruta, /\.webp$/); assert.match(i.miniatura, /_thumb\.webp$/);
    assert.ok(fs.existsSync(path.join(__dirname, '../public', i.ruta)));
    assert.ok(fs.existsSync(path.join(__dirname, '../public', i.miniatura)));
  }
});

const invalidos = [
  ['título vacío', { titulo: '   ' }, /título es obligatorio/],
  ['título de 151 caracteres', { titulo: 'x'.repeat(151) }, /título no debe exceder/],
  ['precio 0', { precio: '0' }, /precio debe ser mayor a 0/],
  ['precio negativo', { precio: '-5' }, /precio debe ser mayor a 0/],
  ['precio no numérico', { precio: 'abc' }, /precio debe ser mayor a 0/],
  ['precio vacío', { precio: '' }, /precio debe ser mayor a 0/],
  ['precio desbordado (>= 1e10)', { precio: '99999999999' }, /precio es demasiado alto/],
  ['recámaras negativas', { recamaras: '-1' }, /recámaras/],
  ['baños decimales', { banos: '2.5' }, /baños/],
  ['ciudad vacía', { ciudad: '' }, /ciudad es obligatoria/],
  ['estado vacío', { estado: '' }, /estado es obligatorio/],
  ['C.P. inválido', { cp: 'ABCDE' }, /C\.P\./],
  ['estatus inválido', { estatus: 'rentada' }, /estatus/],
  ['latitud fuera de rango', { latitud: '91' }, /Latitud fuera de rango/],
  ['longitud sin latitud', { latitud: '' }, /juntas/],
];
for (const [nombre, extra, patron] of invalidos) {
  test(`VALIDACIÓN: ${nombre} → 422, mensaje claro y nada se guarda`, async () => {
    const r = await crearCasa(extra);
    assert.equal(r.status, 422);
    assert.match(r.texto, patron);
    assert.equal(await Casa.count(), 0);
  });
}

test('VALIDACIÓN: al fallar, el formulario conserva lo que escribió el usuario', async () => {
  const r = await crearCasa({ titulo: 'Mi casa linda', precio: '0' });
  assert.equal(r.status, 422); assert.match(r.texto, /value="Mi casa linda"/);
});

test('IMÁGENES: archivo corrupto con tipo image/png → 422, sin casa huérfana ni archivos', async () => {
  const r = await crearCasa({}, [{ buffer: Buffer.from('no soy una imagen'), type: 'image/png', name: 'mala.png' }]);
  assert.equal(r.status, 422); assert.match(r.texto, /no es una imagen válida/);
  assert.equal(await Casa.count(), 0); assert.equal(archivosImg().length, 0);
});

test('IMÁGENES: tipo no permitido (GIF) → 422', async () => {
  const r = await crearCasa({}, [{ buffer: Buffer.from('GIF89a'), type: 'image/gif', name: 'a.gif' }]);
  assert.equal(r.status, 422); assert.match(r.texto, /solo se permiten imágenes JPG, PNG o WebP/);
  assert.equal(await Casa.count(), 0);
});

test('IMÁGENES: una buena y una mala → no se guarda ninguna (todo o nada)', async () => {
  const r = await crearCasa({}, [await imgOk(), { buffer: Buffer.from('basura'), type: 'image/jpeg', name: 'x.jpg' }]);
  assert.equal(r.status, 422);
  assert.equal(await Casa.count(), 0); assert.equal(archivosImg().length, 0);
});

test('IMÁGENES: más de 8 archivos → 422', async () => {
  const una = await imgOk();
  const r = await crearCasa({}, Array.from({ length: 9 }, (_, i) => ({ ...una, name: `f${i}.png` })));
  assert.equal(r.status, 422); assert.match(r.texto, /Máximo 8 imágenes/);
});

test('IMÁGENES: archivo mayor a 10 MB → 422', async () => {
  const r = await crearCasa({}, [{ buffer: Buffer.alloc(11 * 1024 * 1024, 1), type: 'image/png', name: 'enorme.png' }]);
  assert.equal(r.status, 422); assert.match(r.texto, /máximo 10 MB/);
  assert.equal(await Casa.count(), 0);
});

test('CAMBIO: edita una casa y agrega una foto', async () => {
  await crearCasa();
  const casa = await Casa.findOne();
  assert.equal((await admin.get(`/admin/casas/${casa.id}/editar`)).status, 200);
  const _csrf = await admin.token(`/admin/casas/${casa.id}/editar`);
  const r = await admin.multipart(`/admin/casas/${casa.id}/editar`, { _csrf, ...casaValida({ titulo: 'Título nuevo', precio: '2000000', estatus: 'vendida' }) }, [await imgOk()]);
  assert.equal(r.status, 302);
  await casa.reload();
  assert.equal(casa.titulo, 'Título nuevo'); assert.equal(Number(casa.precio), 2000000); assert.equal(casa.estatus, 'vendida');
  assert.equal(await ImagenCasa.count({ where: { casaId: casa.id } }), 1);
});

test('CAMBIO inválido: 422 y los datos anteriores no cambian', async () => {
  await crearCasa(); const casa = await Casa.findOne();
  const _csrf = await admin.token(`/admin/casas/${casa.id}/editar`);
  const r = await admin.multipart(`/admin/casas/${casa.id}/editar`, { _csrf, ...casaValida({ precio: '-1', titulo: 'No debe guardarse' }) });
  assert.equal(r.status, 422);
  await casa.reload(); assert.equal(casa.titulo, 'Casa de prueba');
});

test('CAMBIO con imagen corrupta: 422 y la casa no se modifica', async () => {
  await crearCasa(); const casa = await Casa.findOne();
  const _csrf = await admin.token(`/admin/casas/${casa.id}/editar`);
  const r = await admin.multipart(`/admin/casas/${casa.id}/editar`, { _csrf, ...casaValida({ titulo: 'Cambio parcial' }) }, [{ buffer: Buffer.from('x'), type: 'image/png', name: 'm.png' }]);
  assert.equal(r.status, 422);
  await casa.reload(); assert.equal(casa.titulo, 'Casa de prueba');
});

test('CAMBIO: casa inexistente o id inválido → 404', async () => {
  for (const id of ['99999', 'abc', '0', '-3']) {
    assert.equal((await admin.get(`/admin/casas/${id}/editar`)).status, 404, `GET ${id}`);
    const _csrf = await admin.token('/admin/casas/nueva');
    assert.equal((await admin.multipart(`/admin/casas/${id}/editar`, { _csrf, ...casaValida() })).status, 404, `POST ${id}`);
  }
});

test('QUITAR FOTO: borra el registro y los archivos', async () => {
  await crearCasa({}, [await imgOk()]);
  const casa = await Casa.findOne(); const img = await ImagenCasa.findOne();
  const _csrf = await admin.token(`/admin/casas/${casa.id}/editar`);
  const r = await admin.form(`/admin/casas/${casa.id}/imagenes/${img.id}/eliminar`, { _csrf });
  assert.equal(r.status, 302);
  assert.equal(await ImagenCasa.count(), 0); assert.equal(archivosImg().length, 0);
});

test('BAJA: elimina la casa, sus fotos (BD y disco) y avisa', async () => {
  await crearCasa({}, [await imgOk()]);
  const casa = await Casa.findOne();
  assert.equal(archivosImg().length, 2);
  const _csrf = await admin.token('/admin/casas');
  const r = await admin.form(`/admin/casas/${casa.id}/eliminar`, { _csrf });
  assert.equal(r.status, 302);
  assert.equal(await Casa.count(), 0); assert.equal(await ImagenCasa.count(), 0); assert.equal(archivosImg().length, 0);
  assert.match((await admin.get('/admin/casas')).texto, /Casa eliminada/);
});

test('BAJA de casa inexistente: mensaje de error, sin 500', async () => {
  const _csrf = await admin.token('/admin/casas');
  const r = await admin.form('/admin/casas/99999/eliminar', { _csrf });
  assert.equal(r.status, 302);
  assert.match((await admin.get('/admin/casas')).texto, /La casa no existe/);
});

test('CSRF: sin token o con token falso → 403 y no se ejecuta la acción', async () => {
  await crearCasa(); const casa = await Casa.findOne();
  assert.equal((await admin.form(`/admin/casas/${casa.id}/eliminar`, {})).status, 403);
  assert.equal((await admin.form(`/admin/casas/${casa.id}/eliminar`, { _csrf: '0'.repeat(48) })).status, 403);
  assert.equal((await admin.multipart('/admin/casas', casaValida())).status, 403);
  assert.equal((await admin.multipart(`/admin/casas/${casa.id}/editar`, casaValida({ titulo: 'Hack' }))).status, 403);
  assert.equal(await Casa.count(), 1); await casa.reload(); assert.equal(casa.titulo, 'Casa de prueba');
});

test('CSRF: un formulario multipart externo no puede saltarse la protección en rutas sin multer', async () => {
  await crearCasa(); const casa = await Casa.findOne();
  const r = await admin.multipart(`/admin/casas/${casa.id}/eliminar`, {});
  assert.equal(r.status, 403); assert.equal(await Casa.count(), 1);
  assert.equal((await admin.multipart('/admin/logout', {})).status, 403);
  assert.equal((await admin.get('/admin/casas')).status, 200, 'la sesión sigue activa');
});

test('CSRF: el token de otra sesión no sirve', async () => {
  await crearCasa(); const casa = await Casa.findOne();
  const otra = await ctx.admin();
  const tokenAjeno = await otra.token('/admin/casas');
  assert.equal((await admin.form(`/admin/casas/${casa.id}/eliminar`, { _csrf: tokenAjeno })).status, 403);
});

test('los formularios del admin incluyen el token CSRF', async () => {
  await crearCasa({}, [await imgOk()]); const casa = await Casa.findOne();
  for (const url of ['/admin/casas', '/admin/casas/nueva', `/admin/casas/${casa.id}/editar`]) {
    const t = (await admin.get(url)).texto;
    const formularios = (t.match(/<form[^>]*method="post"/g) || []).length;
    const tokens = (t.match(/name="_csrf"/g) || []).length;
    assert.ok(formularios > 0 && tokens >= formularios, `${url}: ${tokens} tokens para ${formularios} formularios`);
  }
});

test('errores internos: 500 con mensaje genérico, sin filtrar SQL ni detalles', async () => {
  const CasaRepository = require('../src/repositories/CasaRepository');
  const original = CasaRepository.prototype.todas;
  CasaRepository.prototype.todas = async () => { throw new Error('SELECT * FROM secreto — detalle interno'); };
  const silencio = console.error; console.error = () => {};
  try {
    const r = await admin.get('/admin/casas');
    assert.equal(r.status, 500);
    assert.doesNotMatch(r.texto, /SELECT|secreto|detalle interno/);
    assert.match(r.texto, /error interno/i);
  } finally { console.error = silencio; CasaRepository.prototype.todas = original; }
});
