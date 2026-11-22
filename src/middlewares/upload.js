const multer = require('multer');
const { ValidationError } = require('../utils/errors');

const LIMITE_MB = 10;
const MAX_ARCHIVOS = 8;

// Las imágenes se reciben en memoria y ImageService las optimiza antes de guardarlas.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: LIMITE_MB * 1024 * 1024, files: MAX_ARCHIVOS },
  fileFilter: (req, file, cb) => {
    if (/^image\/(jpeg|png|webp)$/.test(file.mimetype)) return cb(null, true);
    return cb(new ValidationError([`"${file.originalname}": solo se permiten imágenes JPG, PNG o WebP.`]));
  },
});

/** Igual que upload.array(), pero los errores de multer salen como ValidationError (422), no como 500. */
function subirImagenes(campo = 'imagenes') {
  const mw = upload.array(campo, MAX_ARCHIVOS);
  return (req, res, next) => mw(req, res, (err) => {
    if (!err) return next();
    // El error se deja en req.erroresSubida; el controlador lo muestra como error de formulario (422).
    if (err instanceof ValidationError) { req.erroresSubida = err.errores; return next(); }
    if (err instanceof multer.MulterError) {
      const msgs = {
        LIMIT_FILE_SIZE: `Cada imagen debe pesar máximo ${LIMITE_MB} MB.`,
        LIMIT_FILE_COUNT: `Máximo ${MAX_ARCHIVOS} imágenes por envío.`,
        LIMIT_UNEXPECTED_FILE: 'Campo de archivo no esperado.',
      };
      req.erroresSubida = [msgs[err.code] || `Error al subir archivos (${err.code}).`];
      return next();
    }
    return next(err);
  });
}

module.exports = { upload, subirImagenes };
