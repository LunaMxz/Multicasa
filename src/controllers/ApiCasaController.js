const CasaService = require('../services/CasaService');

/** API REST de casas (JSON). */
class ApiCasaController {
  constructor(service = new CasaService()) {
    this.service = service;
  }

  list = async (req, res) => {
    const filtros = this.service.normalizarFiltros(req.query);
    const pagina = Math.max(1, parseInt(req.query.pagina, 10) || 1);
    const { casas, total, totalPaginas } = await this.service.buscar(filtros, pagina, 20);
    res.json({ total, pagina, totalPaginas, resultados: casas });
  };

  show = async (req, res) => {
    const casa = await this.service.obtener(req.params.id);
    if (!casa) return res.status(404).json({ error: 'Casa no encontrada' });
    return res.json(casa);
  };

  create = async (req, res) => {
    const casa = await this.service.crear(req.body);
    res.status(201).json(casa);
  };

  update = async (req, res) => {
    const casa = await this.service.actualizar(req.params.id, req.body);
    if (!casa) return res.status(404).json({ error: 'Casa no encontrada' });
    return res.json(casa);
  };

  remove = async (req, res) => {
    const ok = await this.service.eliminar(req.params.id);
    if (!ok) return res.status(404).json({ error: 'Casa no encontrada' });
    return res.status(204).end();
  };

  estadisticas = async (req, res) => {
    res.json(await this.service.estadisticas());
  };
}

module.exports = ApiCasaController;
