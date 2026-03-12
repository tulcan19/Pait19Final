const movimientosServicio = require("./movimientos.servicio");

async function listar(req, res) {
  try {
    const resultado = await movimientosServicio.obtenerMovimientos();
    return res.json(resultado);
  } catch (error) {
    console.error("Error listar movimientos:", error);
    return res.status(500).json({ mensaje: "Error interno del servidor" });
  }
}

async function crear(req, res) {
  try {
    const { id_producto, tipo, cantidad } = req.body;
    const id_usuario = req.usuario.id_usuario; // viene del token

    if (!id_producto || !tipo || cantidad == null) {
      return res.status(400).json({ mensaje: "Faltan datos obligatorios" });
    }

    const resultado = await movimientosServicio.crearMovimiento({
      id_producto: Number(id_producto),
      tipo,
      cantidad: Number(cantidad),
      id_usuario,
    });

    if (!resultado.ok) return res.status(400).json({ mensaje: resultado.mensaje });

    return res.status(201).json({ mensaje: "✅ Movimiento registrado", ...resultado });
  } catch (error) {
    console.error("Error crear movimiento:", error);
    return res.status(500).json({ mensaje: "Error interno del servidor" });
  }
}

module.exports = {
  listar,
  crear,
};
