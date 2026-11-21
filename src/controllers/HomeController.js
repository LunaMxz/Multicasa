const CasaService = require('../services/CasaService');

class HomeController {
  constructor(service = new CasaService()) {
    this.service = service;
  }

  index = async (req, res) => {
    const destacadas = await this.service.destacadas(4);
    // Slider: usa las fotos de las casas destacadas; si no hay, la imagen del diseño
    const slides = destacadas
      .map((c) => ({ c, img: c.imagenPrincipal() }))
      .filter((x) => x.img)
      .map((x) => ({ src: x.img.ruta, titulo: x.c.titulo, href: `/casas/${x.c.id}` }));
    if (!slides.length) slides.push({ src: '/img/hero_casa.png', titulo: 'Multicasa', href: '/casas' });
    res.render('pages/home', { titulo: 'Inicio', destacadas, slides });
  };

  /** Páginas estáticas: home.pagina('compania', 'La Compañía') */
  pagina = (vista, titulo) => (req, res) => res.render(`pages/${vista}`, { titulo });
}

module.exports = HomeController;
