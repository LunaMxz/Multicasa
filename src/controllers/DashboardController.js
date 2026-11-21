const CasaService = require('../services/CasaService');
const PdfService = require('../services/PdfService');

class DashboardController {
  constructor(service = new CasaService(), pdf = new PdfService()) {
    this.service = service;
    this.pdf = pdf;
  }

  index = async (req, res) => {
    const { estatus } = await this.service.estadisticas();
    res.render('admin/dashboard', { titulo: 'Dashboard', estatus, total: estatus.venta + estatus.vendida });
  };

  reporte = async (req, res) => {
    const casas = await this.service.todas();
    this.pdf.reporte(casas, res);
  };
}

module.exports = DashboardController;
