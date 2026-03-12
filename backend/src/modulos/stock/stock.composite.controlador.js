const stockServicio = require('./stock.servicio');

async function asignarYRegistrar(req, res) {
  try {
    const { items, sucursalId } = req.body; // items: [{ id_producto, cantidad }]
    if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ ok: false, mensaje: 'Faltan items' });

    // Solo Operador puede usar este endpoint (seguridad adicional en ruta)
    const id_usuario = req.usuario && req.usuario.id_usuario ? req.usuario.id_usuario : null;
    if (!id_usuario) return res.status(403).json({ ok: false, mensaje: 'Usuario no identificado' });

    const resultado = await stockServicio.asignarYRegistrar(items, id_usuario, sucursalId || null);
    if (!resultado.ok) return res.status(400).json(resultado);
    return res.json(resultado);
  } catch (error) {
    console.error('Error asignarYRegistrar:', error.message);
    return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor' });
  }
}

module.exports = { asignarYRegistrar };
