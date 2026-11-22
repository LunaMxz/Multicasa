const CasaRepository = require('../repositories/CasaRepository');
const ImageService = require('./ImageService');
const { ValidationError } = require('../utils/errors');

const aNumero = (v) => (v === '' || v == null || Number.isNaN(Number(v)) ? null : Number(v));
const PRECIO_MAX = 1e10; // NUMERIC(12,2) admite < 10,000,000,000
const ESTATUS = ['venta', 'vendida'];
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
      recamaras: aNumero(body.recamaras) ?? 0,
      banos: aNumero(body.banos) ?? 0,
      ciudad: aTexto(body.ciudad),
      estado: aTexto(body.estado),
      cp: aTexto(body.cp),
      direccion: aTexto(body.direccion),
      latitud: aNumero(body.latitud),
      longitud: aNumero(body.longitud),
      // vacío/ausente => 'venta'; un valor inválido se rechaza en validar() (antes se cambiaba en silencio)
      estatus: body.estatus == null || body.estatus === '' ? 'venta' : String(body.estatus),
    };
  }

  validar(d) {
    const errores = [];
    const largo = (valor, max, etiqueta) => { if (valor.length > max) errores.push(`${etiqueta} no debe exceder ${max} caracteres.`); };

    if (!d.titulo) errores.push('El título es obligatorio.');
    largo(d.titulo, 150, 'El título');
    largo(d.descripcion, 5000, 'La descripción');
    if (d.precio == null || d.precio <= 0) errores.push('El precio debe ser mayor a 0.');
    else if (d.precio >= PRECIO_MAX) errores.push('El precio es demasiado alto.');
    if (!Number.isInteger(d.recamaras) || d.recamaras < 0 || d.recamaras > 99) errores.push('Las recámaras deben ser un entero entre 0 y 99.');
    if (!Number.isInteger(d.banos) || d.banos < 0 || d.banos > 99) errores.push('Los baños deben ser un entero entre 0 y 99.');
    if (!d.ciudad) errores.push('La ciudad es obligatoria.');
    largo(d.ciudad, 80, 'La ciudad');
    if (!d.estado) errores.push('El estado es obligatorio.');
    largo(d.estado, 80, 'El estado');
    if (d.cp && !/^\d{5}$/.test(d.cp)) errores.push('El C.P. debe tener 5 dígitos.');
    largo(d.direccion, 200, 'La dirección');
    if (!ESTATUS.includes(d.estatus)) errores.push('El estatus debe ser "venta" o "vendida".');
    if (d.latitud != null && (d.latitud < -90 || d.latitud > 90)) errores.push('Latitud fuera de rango.');
    if (d.longitud != null && (d.longitud < -180 || d.longitud > 180)) errores.push('Longitud fuera de rango.');
    if ((d.latitud == null) !== (d.longitud == null)) errores.push('Latitud y longitud deben capturarse juntas.');
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
  // Orden: validar datos -> procesar imágenes -> escribir en BD. Así una imagen inválida
  // nunca deja una casa a medias, y si la BD falla se borran los archivos ya generados.
  async crear(body, files = []) {
    const datos = this.extraerDatos(body);
    const errores = this.validar(datos);
    if (errores.length) throw new ValidationError(errores);
    const procesadas = await this.imagenes.procesar(files);
    try {
      const casa = await this.repo.crear(datos);
      await this.registrarImagenes(casa.id, procesadas);
      return await this.repo.findById(casa.id);
    } catch (e) {
      for (const img of procesadas) await this.imagenes.borrar(img);
      throw e;
    }
  }

  async actualizar(id, body, files = []) {
    const casa = await this.obtener(id);
    if (!casa) return null;
    const datos = this.extraerDatos(body);
    const errores = this.validar(datos);
    if (errores.length) throw new ValidationError(errores);
    const procesadas = await this.imagenes.procesar(files);
    try {
      await this.repo.actualizar(casa, datos);
      await this.registrarImagenes(casa.id, procesadas);
      return await this.repo.findById(casa.id);
    } catch (e) {
      for (const img of procesadas) await this.imagenes.borrar(img);
      throw e;
    }
  }

  async eliminar(id) {
    const casa = await this.obtener(id);
    if (!casa) return false;
    for (const img of casa.imagenes || []) await this.imagenes.borrar(img);
    await this.repo.eliminar(casa);
    return true;
  }

  async registrarImagenes(casaId, procesadas) {
    if (!procesadas.length) return;
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
