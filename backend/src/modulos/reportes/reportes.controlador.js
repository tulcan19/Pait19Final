const servicio = require("./reportes.servicio");

async function ventaPdf(req, res) {
  try {
    const id_venta = Number(req.params.id_venta);
    if (!id_venta) return res.status(400).json({ mensaje: "ID inválido" });

    await servicio.pdfVentaPorId(id_venta, res);
  } catch (e) {
    console.error("Error PDF venta:", e);
    res.status(500).json({ mensaje: "Error generando PDF" });
  }
}

async function movimientosPdf(req, res) {
  try {
    const { tipo, id_producto } = req.query;
    // req.usuario viene del token
    await servicio.pdfMovimientos(res, { tipo, id_producto, usuario: req.usuario });
  } catch (e) {
    console.error("Error PDF movimientos:", e);
    res.status(500).json({ mensaje: "Error generando PDF" });
  }
}

module.exports = { ventaPdf, movimientosPdf };
