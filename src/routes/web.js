const router = require('express').Router();
const HomeController = require('../controllers/HomeController');
const CasaController = require('../controllers/CasaController');
const ContactoController = require('../controllers/ContactoController');

const home = new HomeController();
const casas = new CasaController();
const contacto = new ContactoController();

router.get('/', home.index);
router.get('/compania', home.pagina('compania', 'La Compañía'));
router.get('/servicios', home.pagina('servicios', 'Servicios'));
router.get('/requisitos', home.pagina('requisitos', 'Requisitos'));
router.get('/video', home.pagina('video', 'Video y consejos'));

router.get('/casas', casas.index);
router.get('/casas/:id', casas.show);
router.get('/casas/:id/ficha.pdf', casas.ficha);

router.get('/contacto', contacto.form);
router.post('/contacto', contacto.enviar);

module.exports = router;
