const sharp = require('sharp');
const path = require('path');
const fs = require('fs/promises');
const crypto = require('crypto');
const { ValidationError } = require('../utils/errors');

const PUBLIC_DIR = path.join(__dirname, '../../public');
const DESTINO = path.join(PUBLIC_DIR, 'img/casas');
const MAX_PIXELES = 50_000_000; // evita "bombas de descompresión"

/** Optimiza imágenes: máx. 1600 px + WebP (calidad ~78) y una miniatura de 400 px. */
class ImageService {
  /**
   * Procesa todas las imágenes o ninguna: si una no es válida lanza ValidationError
   * y borra lo que ya se había escrito en disco (no quedan archivos huérfanos).
   */
  async procesar(files = []) {
    await fs.mkdir(DESTINO, { recursive: true });
    const resultado = [];
    try {
      for (const file of files) {
        const id = crypto.randomBytes(8).toString('hex');
        const entrada = () => sharp(file.buffer, { limitInputPixels: MAX_PIXELES }).rotate();
        try {
          await entrada().resize({ width: 1600, withoutEnlargement: true })
            .webp({ quality: 78 }).toFile(path.join(DESTINO, `${id}.webp`));
          await entrada().resize({ width: 400, withoutEnlargement: true })
            .webp({ quality: 75 }).toFile(path.join(DESTINO, `${id}_thumb.webp`));
        } catch (e) {
          await this.borrar({ ruta: `/img/casas/${id}.webp`, miniatura: `/img/casas/${id}_thumb.webp` });
          throw new ValidationError([`"${file.originalname || 'archivo'}" no es una imagen válida o está dañada.`]);
        }
        resultado.push({ ruta: `/img/casas/${id}.webp`, miniatura: `/img/casas/${id}_thumb.webp` });
      }
    } catch (e) {
      for (const img of resultado) await this.borrar(img);
      throw e;
    }
    return resultado;
  }

  async borrar(imagen) {
    for (const ruta of [imagen.ruta, imagen.miniatura]) {
      try { await fs.unlink(path.join(PUBLIC_DIR, ruta)); } catch (_) { /* ya no existe */ }
    }
  }

  rutaAbsoluta(rutaPublica) {
    return path.join(PUBLIC_DIR, rutaPublica);
  }
}

module.exports = ImageService;
