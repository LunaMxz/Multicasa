const PDFDocument = require('pdfkit');
const sharp = require('sharp');
const ImageService = require('./ImageService');
const { moneda } = require('../utils/format');

class PdfService {
  constructor(imagenes = new ImageService()) {
    this.imagenes = imagenes;
  }

  /** Ficha técnica de UNA casa. */
  async ficha(casa, res) {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="ficha-casa-${casa.id}.pdf"`);
    doc.pipe(res);

    doc.fontSize(10).fillColor('#1b5a8f').text('BIENES RAÍCES MULTICASA', { align: 'right' });
    doc.moveDown(0.5).fontSize(20).fillColor('#000').text(casa.titulo);
    doc.fontSize(16).fillColor('#e8821c').text(moneda(casa.precio));
    doc.moveDown();

    const principal = casa.imagenPrincipal();
    if (principal) {
      try {
        // pdfkit no soporta WebP: se convierte a JPEG en memoria
        const buf = await sharp(this.imagenes.rutaAbsoluta(principal.ruta)).resize({ width: 900 }).jpeg({ quality: 80 }).toBuffer();
        doc.image(buf, { fit: [495, 280], align: 'center' });
        doc.moveDown(0.5);
      } catch (_) { /* sin imagen */ }
    }

    doc.fillColor('#000').fontSize(12);
    const filas = [
      ['Estatus', casa.estatus === 'venta' ? 'En venta' : 'Vendida'],
      ['Recámaras', casa.recamaras],
      ['Baños', casa.banos],
      ['Ciudad', casa.ciudad],
      ['Estado', casa.estado],
      ['C.P.', casa.cp || '-'],
      ['Dirección', casa.direccion || '-'],
    ];
    filas.forEach(([k, v]) => doc.font('Helvetica-Bold').text(`${k}: `, { continued: true }).font('Helvetica').text(String(v)));
    if (casa.descripcion) doc.moveDown().font('Helvetica-Bold').text('Descripción').font('Helvetica').text(casa.descripcion);
    doc.end();
  }

  /** Reporte de TODAS las casas con su estatus (venta / vendida). */
  reporte(casas, res) {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="reporte-casas.pdf"');
    doc.pipe(res);

    const enVenta = casas.filter((c) => c.estatus === 'venta');
    doc.fontSize(18).fillColor('#0f3f6b').text('Reporte de casas — Multicasa');
    doc.fontSize(10).fillColor('#444').text(`Generado: ${new Date().toLocaleString('es-MX')}`);
    doc.text(`Total: ${casas.length}   |   En venta: ${enVenta.length}   |   Vendidas: ${casas.length - enVenta.length}`);
    doc.moveDown();

    const cols = [['ID', 40], ['Título', 190], ['Ciudad', 100], ['Precio', 100], ['Estatus', 70]];
    const encabezado = (y) => {
      let x = 40;
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#000');
      cols.forEach(([t, w]) => { doc.text(t, x, y, { width: w }); x += w; });
      doc.moveTo(40, y + 14).lineTo(555, y + 14).stroke('#999');
    };

    let y = doc.y;
    encabezado(y);
    y += 20;
    casas.forEach((c) => {
      if (y > 780) { doc.addPage(); y = 40; encabezado(y); y += 20; }
      const celdas = [c.id, c.titulo, c.ciudad, moneda(c.precio), c.estatus === 'venta' ? 'Venta' : 'Vendida'];
      let x = 40;
      doc.font('Helvetica').fontSize(9).fillColor('#000');
      celdas.forEach((t, i) => { doc.text(String(t), x, y, { width: cols[i][1] - 4, height: 12, ellipsis: true, lineBreak: false }); x += cols[i][1]; });
      y += 16;
    });
    doc.end();
  }
}

module.exports = PdfService;
