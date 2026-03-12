const ventasServicio = require("./ventas.servicio");

async function crear(req, res) {
  try {
    const { id_cliente, metodo_pago, detalles } = req.body;

    if (!detalles || !Array.isArray(detalles) || detalles.length === 0) {
      return res.status(400).json({ mensaje: "Debe incluir al menos un producto en la venta" });
    }

    const id_usuario = req.usuario.id_usuario;

    const resultado = await ventasServicio.registrarVenta({
      id_cliente: id_cliente != null ? Number(id_cliente) : null,
      metodo_pago: metodo_pago || "efectivo",
      detalles,
      id_usuario,
    });

    if (!resultado.ok) return res.status(400).json({ mensaje: resultado.mensaje });

    return res.status(201).json({ mensaje: "✅ Venta registrada", ...resultado });
  } catch (error) {
    console.error("Error crear venta:", error);
    return res.status(500).json({ mensaje: "Error interno del servidor" });
  }
}

async function listar(req, res) {
  try {
    const resultado = await ventasServicio.listarVentas();
    return res.json(resultado);
  } catch (error) {
    console.error("Error listar ventas:", error);
    return res.status(500).json({ mensaje: "Error interno del servidor" });
  }
}

async function detalle(req, res) {
  try {
    const id_venta = Number(req.params.id_venta);
    if (!id_venta) return res.status(400).json({ mensaje: "ID inválido" });

    const resultado = await ventasServicio.detalleVenta(id_venta);
    if (!resultado.ok) return res.status(404).json({ mensaje: resultado.mensaje });

    return res.json(resultado);
  } catch (error) {
    console.error("Error detalle venta:", error);
    return res.status(500).json({ mensaje: "Error interno del servidor" });
  }
}

async function anular(req, res) {
  try {
    const id_venta = Number(req.params.id_venta);
    const { motivo } = req.body;
    if (!id_venta) return res.status(400).json({ mensaje: "ID inválido" });
    if (!motivo || !String(motivo).trim()) return res.status(400).json({ mensaje: "El motivo de anulación es obligatorio" });

    const id_usuario = req.usuario.id_usuario;
    const resultado = await ventasServicio.anularVenta({ id_venta, motivo: String(motivo).trim(), id_usuario });

    if (!resultado.ok) return res.status(400).json({ mensaje: resultado.mensaje });
    return res.json(resultado);
  } catch (error) {
    console.error("Error anular venta:", error);
    return res.status(500).json({ mensaje: "Error interno del servidor" });
  }
}

async function restaurar(req, res) {
  try {
    const id_venta = Number(req.params.id_venta);
    if (!id_venta) return res.status(400).json({ mensaje: "ID inválido" });

    const id_usuario = req.usuario.id_usuario;
    const resultado = await ventasServicio.restaurarVenta({ id_venta, id_usuario });

    if (!resultado.ok) return res.status(400).json({ mensaje: resultado.mensaje });
    return res.json(resultado);
  } catch (error) {
    console.error("Error restaurar venta:", error);
    return res.status(500).json({ mensaje: "Error interno del servidor" });
  }
}

module.exports = {
  crear,
  listar,
  detalle,
  anular,
  restaurar,
};
