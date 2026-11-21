const CasaRepository = require('../repositories/CasaRepository');
const ImageService = require('./ImageService');
const { ValidationError } = require('../utils/errors');

const aNumero = (v) => (v === '' || v == null || Number.isNaN(Number(v)) ? null : Number(v));
const aTexto = (v) => (v == null ? '' : String(v).trim());

class CasaService {
  constructor(repo = new CasaRepository(), imagenes = new ImageService()) {
    this.repo = repo;
    this.imagenes = imagenes;
  }

  // ----- Entrada de datos -----
  normalizarFiltros(query = {}) {
    return {
      q: aTexto(query.q),
      precioMin: aNumero(query.precioMin),
      precioMax: aNumero(query.precioMax),
      recamaras: aNumero(query.recamaras),
      banos: aNumero(query.banos),
    };
  }

  extraerDatos(body = {}) {
    return {
      titulo: aTexto(body.titulo),
      descripcion: aTexto(body.descripcion),
      precio: aNumero(body.precio),
      recamaras: aNumero(body.recamaras) || 0,
      banos: aNumero(body.banos) || 0,
      ciudad: aTexto(body.ciudad),
      estado: aTexto(body.estado),
      cp: aTexto(body.cp),
      direccion: aTexto(body.direccion),
      latitud: aNumero(body.latitud),
      longitud: aNumero(body.longitud),
      estatus: ['venta', 'vendida'].includes(body.estatus) ? body.estatus : 'venta',
    };
  }

  validar(d) {
    const errores = [];
    if (!d.titulo) errores.push('El título es obligatorio.');
    if (d.precio == null || d.precio <= 0) errores.push('El precio debe ser mayor a 0.');
    if (!d.ciudad) errores.push('La ciudad es obligatoria.');
    if (!d.estado) errores.push('El estado es obligatorio.');
    if (d.latitud != null && (d.latitud < -90 || d.latitud > 90)) errores.push('Latitud fuera de rango.');
    if (d.longitud != null && (d.longitud < -180 || d.longitud > 180)) errores.push('Longitud fuera de rango.');
    return errores;
  }

  // ----- Consultas -----
  async buscar(filtros, pagina = 1, porPagina = 9) {
    const { rows, count } = await this.repo.buscar(
      { ...filtros, estatus: 'venta' },
      { limit: porPagina, offset: (pagina - 1) * porPagina }
    );
    return { casas: rows, total: count, totalPaginas: Math.max(1, Math.ceil(count / porPagina)) };
  }

  async destacadas(n = 4) {
    const { rows } = await this.repo.buscar({ estatus: 'venta' }, { limit: n, offset: 0 });
    return rows;
  }

  todas() {
    return this.repo.todas();
  }

  obtener(id) {
    const n = parseInt(id, 10);
    return n > 0 ? this.repo.findById(n) : null;
  }

  estadisticas() {
    return this.repo.estadisticas();
  }

  // ----- Mantenimiento (altas, bajas, cambios) -----
  async crear(body, files = []) {
    const datos = this.extraerDatos(body);
    const errores = this.validar(datos);
    if (errores.length) throw new ValidationError(errores);
    const casa = await this.repo.crear(datos);
    await this.guardarImagenes(casa.id, files);
    return this.repo.findById(casa.id);
  }

  async actualizar(id, body, files = []) {
    const casa = await this.obtener(id);
    if (!casa) return null;
    const datos = this.extraerDatos(body);
    const errores = this.validar(datos);
    if (errores.length) throw new ValidationError(errores);
    await this.repo.actualizar(casa, datos);
    await this.guardarImagenes(casa.id, files);
    return this.repo.findById(casa.id);
  }

  async eliminar(id) {
    const casa = await this.obtener(id);
    if (!casa) return false;
    for (const img of casa.imagenes || []) await this.imagenes.borrar(img);
    await this.repo.eliminar(casa);
    return true;
  }

  async guardarImagenes(casaId, files) {
    if (!files || !files.length) return;
    const procesadas = await this.imagenes.procesar(files);
    let hayPrincipal = await this.repo.tienePrincipal(casaId);
    const registros = procesadas.map((img) => {
      const esPrincipal = !hayPrincipal;
      hayPrincipal = true;
      return { ...img, esPrincipal, casaId };
    });
    await this.repo.agregarImagenes(registros);
  }

  async eliminarImagen(casaId, imagenId) {
    const img = await this.repo.buscarImagen(casaId, imagenId);
    if (!img) return false;
    await this.imagenes.borrar(img);
    await img.destroy();
    return true;
  }
}

module.exports = CasaService;
