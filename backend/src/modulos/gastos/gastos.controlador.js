const gastosServicio = require("./gastos.servicio");

async function crear(req, res) {
  try {
    const { concepto, monto, observacion, categoria } = req.body;

    const id_usuario = req.usuario.id_usuario;

    const resultado = await gastosServicio.registrarGasto({
      concepto,
      monto,
      observacion,
      categoria,
      id_usuario,
    });

    if (!resultado.ok) return res.status(400).json({ mensaje: resultado.mensaje });

    return res.status(201).json({ mensaje: "✅ Gasto registrado", ...resultado });
  } catch (error) {
    console.error("Error crear gasto:", error);
    return res.status(500).json({ mensaje: "Error interno del servidor" });
  }
}

async function listar(req, res) {
  try {
    const resultado = await gastosServicio.obtenerGastos();
    return res.json(resultado);
  } catch (error) {
    console.error("Error listar gastos:", error);
    return res.status(500).json({ mensaje: "Error interno del servidor" });
  }
}

module.exports = {
  crear,
  listar,
};
