const { Op, fn, col, literal } = require('sequelize');
const { Casa, ImagenCasa } = require('../models');

const INCLUIR_IMAGENES = [{ model: ImagenCasa, as: 'imagenes' }];

// Rangos de costo para el dashboard (etiqueta en orden ascendente)
const RANGOS = ['< $1M', '$1M - $2M', '$2M - $3M', '$3M - $5M', '> $5M'];
const CASE_RANGO = literal(
  `CASE WHEN "Casa"."precio" < 1000000 THEN '< $1M'
        WHEN "Casa"."precio" < 2000000 THEN '$1M - $2M'
        WHEN "Casa"."precio" < 3000000 THEN '$2M - $3M'
        WHEN "Casa"."precio" < 5000000 THEN '$3M - $5M'
        ELSE '> $5M' END`
);

/**
 * PATRÓN REPOSITORY: los controladores y servicios NO hablan con Sequelize
 * directamente; todo acceso a la tabla `casas` pasa por esta clase.
 */
class CasaRepository {
  construirWhere(f = {}) {
    const where = {};
    if (f.estatus) where.estatus = f.estatus;
    if (f.q) {
      const like = { [Op.iLike]: `%${String(f.q).replace(/[%_\\]/g, '\\$&')}%` };
      where[Op.or] = [{ ciudad: like }, { estado: like }, { cp: like }];
    }
    if (f.precioMin != null || f.precioMax != null) {
      where.precio = {};
      if (f.precioMin != null) where.precio[Op.gte] = f.precioMin;
      if (f.precioMax != null) where.precio[Op.lte] = f.precioMax;
    }
    if (f.recamaras) where.recamaras = { [Op.gte]: f.recamaras };
    if (f.banos) where.banos = { [Op.gte]: f.banos };
    return where;
  }

  buscar(filtros = {}, { limit = 9, offset = 0 } = {}) {
    return Casa.findAndCountAll({
      where: this.construirWhere(filtros),
      include: INCLUIR_IMAGENES,
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      distinct: true,
    });
  }

  todas() {
    return Casa.findAll({ include: INCLUIR_IMAGENES, order: [['id', 'ASC']] });
  }

  findById(id) {
    return Casa.findByPk(id, {
      include: INCLUIR_IMAGENES,
      order: [[{ model: ImagenCasa, as: 'imagenes' }, 'esPrincipal', 'DESC']],
    });
  }

  crear(datos) {
    return Casa.create(datos);
  }

  actualizar(casa, datos) {
    return casa.update(datos);
  }

  eliminar(casa) {
    return casa.destroy();
  }

  // ----- Imágenes -----
  async tienePrincipal(casaId) {
    return (await ImagenCasa.count({ where: { casaId, esPrincipal: true } })) > 0;
  }

  agregarImagenes(imagenes) {
    return ImagenCasa.bulkCreate(imagenes);
  }

  async buscarImagen(casaId, imagenId) {
    return ImagenCasa.findOne({ where: { id: imagenId, casaId } });
  }

  // ----- Estadísticas para el dashboard -----
  async estadisticas() {
    const porEstatus = await Casa.findAll({
      attributes: ['estatus', [fn('COUNT', col('id')), 'total']],
      group: ['estatus'],
      raw: true,
    });
    const filasRango = await Casa.findAll({
      attributes: [[CASE_RANGO, 'rango'], [fn('COUNT', col('id')), 'total']],
      group: [CASE_RANGO],
      raw: true,
    });

    const estatus = { venta: 0, vendida: 0 };
    porEstatus.forEach((r) => { estatus[r.estatus] = Number(r.total); });

    const mapa = Object.fromEntries(filasRango.map((r) => [r.rango, Number(r.total)]));
    const porRango = RANGOS.map((r) => ({ rango: r, total: mapa[r] || 0 }));

    return { estatus, porRango };
  }
}

module.exports = CasaRepository;
