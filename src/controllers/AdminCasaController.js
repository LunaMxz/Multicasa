const CasaService = require('../services/CasaService');
const { ValidationError } = require('../utils/errors');

/** Mantenimiento de casas: altas, bajas y cambios (solo administradores). */
class AdminCasaController {
  constructor(service = new CasaService()) {
    this.service = service;
  }

  index = async (req, res) => {
    const casas = await this.service.todas();
    res.render('admin/casas-index', { titulo: 'Casas', casas });
  };

  nueva = (req, res) => res.render('admin/casa-form', { titulo: 'Nueva casa', casa: { estatus: 'venta' }, errores: [] });

  crear = async (req, res) => {
    try {
      await this.service.crear(req.body, req.files);
      req.session.flash = { tipo: 'ok', mensaje: 'Casa creada correctamente.' };
      return res.redirect('/admin/casas');
    } catch (e) {
      if (!(e instanceof ValidationError)) throw e;
      return res.status(422).render('admin/casa-form', { titulo: 'Nueva casa', casa: { ...req.body }, errores: e.errores });
    }
  };

  editar = async (req, res) => {
    const casa = await this.service.obtener(req.params.id);
    if (!casa) return res.status(404).render('pages/404', { titulo: 'No encontrada' });
    return res.render('admin/casa-form', { titulo: `Editar casa #${casa.id}`, casa, errores: [] });
  };

  actualizar = async (req, res) => {
    try {
      const casa = await this.service.actualizar(req.params.id, req.body, req.files);
      if (!casa) return res.status(404).render('pages/404', { titulo: 'No encontrada' });
      req.session.flash = { tipo: 'ok', mensaje: 'Casa actualizada.' };
      return res.redirect('/admin/casas');
    } catch (e) {
      if (!(e instanceof ValidationError)) throw e;
      const actual = await this.service.obtener(req.params.id);
      return res.status(422).render('admin/casa-form', {
        titulo: 'Editar casa', casa: { ...req.body, id: req.params.id, imagenes: actual ? actual.imagenes : [] }, errores: e.errores,
      });
    }
  };

  eliminar = async (req, res) => {
    const ok = await this.service.eliminar(req.params.id);
    req.session.flash = ok ? { tipo: 'ok', mensaje: 'Casa eliminada.' } : { tipo: 'error', mensaje: 'La casa no existe.' };
    res.redirect('/admin/casas');
  };

  eliminarImagen = async (req, res) => {
    await this.service.eliminarImagen(req.params.id, req.params.imagenId);
    res.redirect(`/admin/casas/${req.params.id}/editar`);
  };
}

module.exports = AdminCasaController;
