const inventarioRepositorio = require("./inventario.repositorio");

async function crearMovimiento({ id_producto, tipo, cantidad, id_usuario }) {
  const producto = await inventarioRepositorio.obtenerProductoPorId(id_producto);

  if (!producto) return { ok: false, mensaje: "Producto no encontrado" };
  if (!producto.activo) return { ok: false, mensaje: "No se puede mover stock de un producto desactivado" };

  if (!["entrada", "salida", "ajuste"].includes(tipo)) {
    return { ok: false, mensaje: "Tipo inválido (use: entrada, salida, ajuste)" };
  }

  if (!Number.isInteger(cantidad) || cantidad <= 0) {
    return { ok: false, mensaje: "Cantidad inválida (debe ser entero mayor a 0)" };
  }

  const stock_anterior = Number(producto.stock);
  let stock_actual = stock_anterior;

  if (tipo === "entrada") {
    stock_actual = stock_anterior + cantidad;
  }

  if (tipo === "salida") {
    if (cantidad > stock_anterior) {
      return { ok: false, mensaje: "Stock insuficiente para realizar la salida" };
    }
    stock_actual = stock_anterior - cantidad;
  }

  if (tipo === "ajuste") {
    // Ajuste = poner el stock exactamente a "cantidad"
    stock_actual = cantidad;
  }

  // 1) Actualizar stock
  const productoActualizado = await inventarioRepositorio.actualizarStockProducto(id_producto, stock_actual);

  // 2) Registrar movimiento
  const movimiento = await inventarioRepositorio.registrarMovimiento({
    id_producto,
    tipo,
    cantidad,
    stock_anterior,
    stock_actual,
    id_usuario,
  });

  return { ok: true, movimiento, producto: productoActualizado };
}

async function obtenerMovimientos() {
  const movimientos = await inventarioRepositorio.listarMovimientos();
  return { ok: true, movimientos };
}

module.exports = {
  crearMovimiento,
  obtenerMovimientos,
};
