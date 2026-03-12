const repo = require("./reportes.repositorio");
const PDFDocument = require("pdfkit");

// ============================
// PDF: VENTA POR ID
// ============================
async function pdfVentaPorId(id_venta, res) {
  const cabecera = await repo.obtenerVentaCabecera(id_venta);
  if (!cabecera) {
    res.status(404).json({ mensaje: "Venta no encontrada" });
    return;
  }
  const detalle = await repo.obtenerVentaDetalle(id_venta);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `inline; filename="venta_${cabecera.id_venta}.pdf"`
  );

  const doc = new PDFDocument({ size: "A4", margin: 40 });
  doc.pipe(res);

  // Título
  doc.fontSize(18).text("Reporte de Venta", { align: "center" });
  doc.moveDown();

  // Cabecera
  doc.fontSize(11);
  doc.text(`Venta #${cabecera.id_venta}`);
  doc.text(`Fecha: ${new Date(cabecera.fecha).toLocaleString()}`);
  doc.text(`Cliente: ${cabecera.cliente || "-"}`);
  doc.text(`Usuario: ${cabecera.usuario || "-"}`);
  doc.text(`Estado: ${cabecera.estado}`);
  doc.text(`Total: $ ${Number(cabecera.total).toFixed(2)}`);
  doc.moveDown();

  // Tabla simple
  doc.fontSize(12).text("Detalle", { underline: true });
  doc.moveDown(0.5);

  const startX = doc.x;
  let y = doc.y;

  // Encabezados
  doc.fontSize(10).text("Producto", startX, y);
  doc.text("Cant.", startX + 260, y);
  doc.text("Precio", startX + 320, y);
  doc.text("Subtotal", startX + 400, y);

  y += 18;
  doc.moveTo(startX, y).lineTo(startX + 500, y).stroke();
  y += 8;

  // Filas
  for (const d of detalle) {
    doc.text(d.nombre, startX, y, { width: 250 });
    doc.text(String(d.cantidad), startX + 260, y);
    doc.text(`$ ${Number(d.precio).toFixed(2)}`, startX + 320, y);
    doc.text(`$ ${Number(d.subtotal).toFixed(2)}`, startX + 400, y);

    y += 18;

    // salto de página
    if (y > 740) {
      doc.addPage();
      y = doc.y;
    }
  }

  doc.moveDown(2);
  doc.fontSize(9).text("Generado por el sistema de inventario.", { align: "right" });

  doc.end();
}

// ============================
// PDF: MOVIMIENTOS (KARDEX)
// ============================
async function pdfMovimientos(res, { tipo, id_producto, usuario }) {
  const movimientos = await repo.listarMovimientos({ tipo, id_producto });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="movimientos.pdf"`);

  const doc = new PDFDocument({ size: "A4", margin: 30 });
  doc.pipe(res);

  doc.fontSize(16).text("Reporte de Movimientos (Kardex)", { align: "center" });
  doc.moveDown();

  doc.fontSize(10).text(
    `Generado por: ${usuario?.nombre || "-"} (${usuario?.rol || "-"})`
  );
let productoTxt = "todos";
if (id_producto) {
  const nombreProd = await repo.obtenerNombreProducto(id_producto);
  productoTxt = nombreProd ? `${id_producto} - ${nombreProd}` : String(id_producto);
}

doc.text(`Filtro tipo: ${tipo || "todos"} | Producto: ${productoTxt}`);
  doc.moveDown();

  // Encabezados tabla
  let y = doc.y;
  const x = doc.x;

  doc.fontSize(8);
  doc.text("Fecha", x, y);
  doc.text("Tipo", x + 90, y);
  doc.text("Producto", x + 140, y, { width: 180 });
  doc.text("Cant.", x + 330, y);
  doc.text("Ant.", x + 370, y);
  doc.text("Act.", x + 410, y);
  doc.text("Usuario", x + 450, y, { width: 120 });

  y += 14;
  doc.moveTo(x, y).lineTo(x + 520, y).stroke();
  y += 6;

  for (const m of movimientos) {
    doc.text(new Date(m.fecha).toLocaleString(), x, y, { width: 85 });
    doc.text(m.tipo, x + 90, y);
    doc.text(m.producto || String(m.id_producto), x + 140, y, { width: 180 });
    doc.text(String(m.cantidad), x + 330, y);
    doc.text(String(m.stock_anterior), x + 370, y);
    doc.text(String(m.stock_actual), x + 410, y);
    doc.text(m.usuario || "-", x + 450, y, { width: 120 });

    y += 14;

    if (y > 780) {
      doc.addPage();
      y = doc.y;
    }
  }

  doc.end();
}

module.exports = {
  pdfVentaPorId,
  pdfMovimientos,
};
