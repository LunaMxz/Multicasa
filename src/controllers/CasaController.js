const CasaService = require('../services/CasaService');
const PdfService = require('../services/PdfService');

class CasaController {
  constructor(service = new CasaService(), pdf = new PdfService()) {
    this.service = service;
    this.pdf = pdf;
  }

  /** Búsqueda de casas + mapa con los resultados */
  index = async (req, res) => {
    const filtros = this.service.normalizarFiltros(req.query);
    const pagina = Math.max(1, parseInt(req.query.pagina, 10) || 1);
    const { casas, total, totalPaginas } = await this.service.buscar(filtros, pagina);

    const params = new URLSearchParams();
    Object.entries(req.query).forEach(([k, v]) => { if (k !== 'pagina' && v) params.set(k, v); });

    const marcadores = casas
      .filter((c) => c.latitud && c.longitud)
      .map((c) => ({ id: c.id, titulo: c.titulo, lat: Number(c.latitud), lng: Number(c.longitud) }));

    res.render('pages/casas', { titulo: 'Casas en venta', casas, total, filtros, pagina, totalPaginas, qs: params.toString(), marcadores });
  };

  show = async (req, res) => {
    const casa = await this.service.obtener(req.params.id);
    if (!casa) return res.status(404).render('pages/404', { titulo: 'No encontrada' });
    res.render('pages/casa-detalle', { titulo: casa.titulo, casa });
  };

  ficha = async (req, res) => {
    const casa = await this.service.obtener(req.params.id);
    if (!casa) return res.status(404).render('pages/404', { titulo: 'No encontrada' });
    await this.pdf.ficha(casa, res);
  };
}

module.exports = CasaController;
