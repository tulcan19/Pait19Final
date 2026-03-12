const servicio = require("./compras.servicio");

async function crear(req, res) {
  try {
    const { id_proveedor, detalles } = req.body;

    if (!id_proveedor || !detalles) {
      return res.status(400).json({ mensaje: "Faltan datos obligatorios" });
    }

    const id_usuario = req.usuario.id_usuario;

    const resultado = await servicio.registrarCompra({
      id_proveedor: Number(id_proveedor),
      detalles,
      id_usuario,
    });

    if (!resultado.ok) return res.status(400).json({ mensaje: resultado.mensaje });

    return res.status(201).json({ mensaje: "✅ Compra registrada", ...resultado });
  } catch (error) {
    console.error("Error crear compra:", error);
    return res.status(500).json({ mensaje: "Error interno del servidor" });
  }
}

async function listar(req, res) {
  try {
    const resultado = await servicio.listarCompras();
    return res.json(resultado);
  } catch (error) {
    console.error("Error listar compras:", error);
    return res.status(500).json({ mensaje: "Error interno del servidor" });
  }
}

async function detalle(req, res) {
  try {
    const id_compra = Number(req.params.id_compra);
    if (!id_compra) return res.status(400).json({ mensaje: "ID inválido" });

    const resultado = await servicio.detalleCompra(id_compra);
    if (!resultado.ok) return res.status(404).json({ mensaje: resultado.mensaje });

    return res.json(resultado);
  } catch (error) {
    console.error("Error detalle compra:", error);
    return res.status(500).json({ mensaje: "Error interno del servidor" });
  }
}

module.exports = {
  crear,
  listar,
  detalle,
};
