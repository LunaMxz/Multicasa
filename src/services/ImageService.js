const sharp = require('sharp');
const path = require('path');
const fs = require('fs/promises');
const crypto = require('crypto');

const PUBLIC_DIR = path.join(__dirname, '../../public');
const DESTINO = path.join(PUBLIC_DIR, 'img/casas');

/** Optimiza imágenes: máx. 1600 px + WebP (calidad ~78) y una miniatura de 400 px. */
class ImageService {
  async procesar(files = []) {
    await fs.mkdir(DESTINO, { recursive: true });
    const resultado = [];
    for (const file of files) {
      const id = crypto.randomBytes(8).toString('hex');
      await sharp(file.buffer).rotate().resize({ width: 1600, withoutEnlargement: true })
        .webp({ quality: 78 }).toFile(path.join(DESTINO, `${id}.webp`));
      await sharp(file.buffer).rotate().resize({ width: 400, withoutEnlargement: true })
        .webp({ quality: 75 }).toFile(path.join(DESTINO, `${id}_thumb.webp`));
      resultado.push({ ruta: `/img/casas/${id}.webp`, miniatura: `/img/casas/${id}_thumb.webp` });
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
