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
    const texto = (valor) => {
      return typeof valor === 'string'
        ? valor.trim().slice(0, 100)
        : '';
    };

    const numero = (valor) => {
      if (
        typeof valor !== 'string' &&
        typeof valor !== 'number'
      ) {
        return null;
      }

      if (String(valor).trim() === '') return null;

      const n = Number(valor);

      return Number.isFinite(n) ? n : null;
    };

    return {
      q: texto(query.q),
      precioMin: numero(query.precioMin),
      precioMax: numero(query.precioMax),
      recamaras: numero(query.recamaras),
      banos: numero(query.banos)
    };
  }

  validarFiltros(query = {}) {
    const errores = [];

    const validarNumero = (campo, etiqueta, entero = false) => {
      const valor = query[campo];

      if (valor == null || valor === '') return null;

      if (
        typeof valor !== 'string' ||
        valor.trim() === ''
      ) {
        errores.push(`${etiqueta} debe ser un número válido.`);
        return null;
      }

      const n = Number(valor);

      if (
        !Number.isFinite(n) ||
        n < 0 ||
        (entero && !Number.isInteger(n))
      ) {
        errores.push(`${etiqueta} debe ser un número válido.`);
        return null;
      }

      return n;
    };

    if (
      query.q != null &&
      (typeof query.q !== 'string' || query.q.length > 100)
    ) {
      errores.push(
        'La búsqueda debe contener como máximo 100 caracteres.'
      );
    }

    const min = validarNumero('precioMin', 'El precio mínimo');
    const max = validarNumero('precioMax', 'El precio máximo');

    const recamaras = validarNumero(
      'recamaras',
      'Las recámaras',
      true
    );

    const banos = validarNumero(
      'banos',
      'Los baños',
      true
    );

    if (min !== null && max !== null && min > max) {
      errores.push(
        'El precio mínimo no puede ser mayor que el máximo.'
      );
    }

    if (recamaras !== null && recamaras > 99) {
      errores.push('Las recámaras no pueden superar 99.');
    }

    if (banos !== null && banos > 99) {
      errores.push('Los baños no pueden superar 99.');
    }

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
