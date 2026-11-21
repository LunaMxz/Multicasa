const multer = require('multer');

// Las imágenes se reciben en memoria y ImageService las optimiza antes de guardarlas.
module.exports = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 8 },
  fileFilter: (req, file, cb) => {
    if (/^image\/(jpeg|png|webp)$/.test(file.mimetype)) return cb(null, true);
    return cb(new Error('Solo se permiten imágenes JPG, PNG o WebP.'));
  },
});
