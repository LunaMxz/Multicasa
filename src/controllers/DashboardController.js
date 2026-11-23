
const CasaService = require('../services/CasaService');
const PdfService = require('../services/PdfService');

class DashboardController {
  constructor(service = new CasaService(), pdf = new PdfService()) {
    this.service = service;
    this.pdf = pdf;
  }

  index = async (req, res) => {
    try {
      const { estatus } = await this.service.estadisticas();
      const registros = await this.service.todas();

      const casas = registros.map((registro) => {
        const casa = registro.get
          ? registro.get({ plain: true })
          : registro;

        return {
          id: casa.id,
          titulo: casa.titulo,
          ciudad: casa.ciudad,
          estado: casa.estado,
          precio: Number(casa.precio) || 0,
          estatus: casa.estatus,
          recamaras: Number(casa.recamaras) || 0,
          banos: Number(casa.banos) || 0,
          latitud: casa.latitud == null
            ? null
            : Number(casa.latitud),
          longitud: casa.longitud == null
            ? null
            : Number(casa.longitud)
        };
      });

      const total = casas.length;
      const enVenta = casas.filter(
        (c) => c.estatus === 'venta'
      );
      const vendidas = casas.filter(
        (c) => c.estatus === 'vendida'
      );

      const valorInventario = enVenta.reduce(
        (suma, c) => suma + c.precio, 0
      );

      const valorVendido = vendidas.reduce(
        (suma, c) => suma + c.precio, 0
      );

      const precioPromedio = total
        ? casas.reduce((suma, c) => suma + c.precio, 0) / total
        : 0;

      const porcentajeVendido = total
        ? (vendidas.length / total) * 100
        : 0;

      const ciudades = [...new Set(
        casas.map((c) => c.ciudad).filter(Boolean)
      )].sort((a, b) => a.localeCompare(b, 'es'));

      res.render('admin/dashboard', {
        titulo: 'Dashboard',
        estatus,
        total,
        casas,
        ciudades,
        resumen: {
          enVenta: enVenta.length,
          vendidas: vendidas.length,
          valorInventario,
          valorVendido,
          precioPromedio,
          porcentajeVendido
        }
      });

    } catch (error) {
      console.error('Error en dashboard:', error);
      res.status(500).send(
        'No fue posible cargar el dashboard.'
      );
    }
  };

  reporte = async (req, res) => {
    const casas = await this.service.todas();
    this.pdf.reporte(casas, res);
  };
}

module.exports = DashboardController;
