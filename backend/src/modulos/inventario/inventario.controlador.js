const inventarioServicio = require("./inventario.servicio");

async function registrar(req, res) {
  try {
    const { id_producto, tipo, cantidad } = req.body;

    if (!id_producto || !tipo || cantidad == null) {
      return res.status(400).json({ mensaje: "Faltan datos obligatorios" });
    }

    const id_usuario = req.usuario.id_usuario;

    const resultado = await inventarioServicio.crearMovimiento({
      id_producto: Number(id_producto),
      tipo,
      cantidad: Number(cantidad),
      id_usuario,
    });

    if (!resultado.ok) return res.status(400).json({ mensaje: resultado.mensaje });

    return res.status(201).json({ mensaje: "✅ Movimiento registrado", ...resultado });
  } catch (error) {
    console.error("Error registrar movimiento:", error);
    return res.status(500).json({ mensaje: "Error interno del servidor" });
  }
}

async function listar(req, res) {
  try {
    const resultado = await inventarioServicio.obtenerMovimientos();
    return res.json(resultado);
  } catch (error) {
    console.error("Error listar movimientos:", error);
    return res.status(500).json({ mensaje: "Error interno del servidor" });
  }
}

module.exports = {
  registrar,
  listar,
};
