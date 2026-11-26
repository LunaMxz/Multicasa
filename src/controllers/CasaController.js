
const CasaService = require('../services/CasaService');
const PdfService = require('../services/PdfService');

class CasaController {
  constructor(
    service = new CasaService(),
    pdf = new PdfService()
  ) {
    this.service = service;
    this.pdf = pdf;
  }

  // Listado de propiedades, filtros, paginación y mapa
  index = async (req, res) => {
    try {
      const filtros = this.service.normalizarFiltros(req.query);
      const errores = this.service.validarFiltros(req.query);

      const paginaSolicitada = Number(req.query.pagina);
      const pagina = Number.isSafeInteger(paginaSolicitada) &&
        paginaSolicitada > 0
          ? Math.min(paginaSolicitada, 100000)
          : 1;

      const params = new URLSearchParams();

      for (const campo of [
        'q',
        'precioMin',
        'precioMax',
        'recamaras',
        'banos'
      ]) {
        const valor = req.query[campo];

        if (typeof valor === 'string' && valor.trim()) {
          params.set(campo, valor.trim());
        }
      }

      let resultado = {
        casas: [],
        total: 0,
        totalPaginas: 1
      };

      let paginaActual = pagina;

      if (errores.length === 0) {
        resultado = await this.service.buscar(filtros, pagina);

        if (pagina > resultado.totalPaginas) {
          paginaActual = resultado.totalPaginas;

          resultado = await this.service.buscar(
            filtros,
            paginaActual
          );
        }
      }

      const { casas, total, totalPaginas } = resultado;

      const marcadores = casas
        .filter((casa) => {
          if (
            casa.latitud == null ||
            casa.longitud == null
          ) return false;

          const lat = Number(casa.latitud);
          const lng = Number(casa.longitud);

          return Number.isFinite(lat) &&
            Number.isFinite(lng) &&
            lat >= -90 && lat <= 90 &&
            lng >= -180 && lng <= 180;
        })
        .map((casa) => ({
          id: casa.id,
          titulo: casa.titulo,
          lat: Number(casa.latitud),
          lng: Number(casa.longitud),
          precio: Number(casa.precio),
          ciudad: casa.ciudad
        }));

      res.status(errores.length ? 400 : 200).render(
        'pages/casas',
        {
          titulo: 'Casas en venta',
          casas,
          total,
          filtros,
          pagina: paginaActual,
          totalPaginas,
          qs: params.toString(),
          marcadores,
          erroresFiltros: errores
        }
      );
    } catch (error) {
      console.error('Error buscando propiedades:', error);

      res.status(500).send(
        'No fue posible realizar la búsqueda de propiedades.'
      );
    }
  };

  // Detalle de la propiedad
  show = async (req, res) => {
    try {
      const casa = await this.service.obtener(req.params.id);

      if (!casa) {
        return res.status(404).render('pages/404', {
          titulo: 'No encontrada'
        });
      }

      res.render('pages/casa-detalle', {
        titulo: casa.titulo,
        casa
      });
    } catch (error) {
      console.error('Error consultando casa:', error);
      res.status(500).send(
        'No fue posible consultar esta propiedad.'
      );
    }
  };

  // Ficha técnica PDF (se conserva)
  ficha = async (req, res) => {
    const casa = await this.service.obtener(req.params.id);

    if (!casa) {
      return res.status(404).render('pages/404', {
        titulo: 'No encontrada'
      });
    }

    await this.pdf.ficha(casa, res);
  };
}

module.exports = CasaController;
