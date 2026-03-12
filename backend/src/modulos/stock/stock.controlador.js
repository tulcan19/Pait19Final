const stockServicio = require("./stock.servicio");

async function asignarLotes(req, res) {
  try {
    const { productoId, sucursalId, cantidad } = req.body;
    if (!productoId || cantidad == null) return res.status(400).json({ ok: false, mensaje: "Faltan datos" });

    // Seguridad: operadores no pueden forzar asignaciones manuales ni overrides
    // Si el cliente envía `force: true` solo los Administradores pueden usarlo
    const fuerzaSolicitada = !!req.body.force;
    const rolUsuario = req.usuario && req.usuario.rol ? req.usuario.rol : null;
    if (fuerzaSolicitada && rolUsuario !== "Administrador") {
      return res.status(403).json({ ok: false, mensaje: "No autorizado: solo Administrador puede forzar asignaciones" });
    }

    const resultado = await stockServicio.asignarLotes(Number(productoId), sucursalId || null, Number(cantidad));
    if (!resultado.ok) return res.status(400).json(resultado);
    return res.json({ ok: true, asignados: resultado.asignados });
  } catch (error) {
    console.error("Error asignar lotes:", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno del servidor" });
  }
}

async function obtenerLotesByProducto(req, res) {
  try {
    const { productoId } = req.params;
    if (!productoId) return res.status(400).json({ ok: false, mensaje: "Falta productoId" });

    const resultado = await stockServicio.obtenerResumenLotes(Number(productoId));
    return res.json(resultado);
  } catch (error) {
    console.error("Error obtenerLotesByProducto:", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno del servidor" });
  }
}

module.exports = { asignarLotes, obtenerLotesByProducto };
