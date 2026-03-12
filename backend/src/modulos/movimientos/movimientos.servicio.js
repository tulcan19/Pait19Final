const movimientosRepositorio = require("./movimientos.repositorio");

async function obtenerMovimientos() {
  const movimientos = await movimientosRepositorio.listarMovimientos();
  return { ok: true, movimientos };
}

async function crearMovimiento({ id_producto, tipo, cantidad, id_usuario }) {
  const producto = await movimientosRepositorio.obtenerProductoPorId(id_producto);
  if (!producto) return { ok: false, mensaje: "Producto no encontrado" };
  if (!producto.activo) return { ok: false, mensaje: "Producto inactivo" };

  const stock_anterior = Number(producto.stock);
  const cant = Number(cantidad);

  if (!["entrada", "salida", "ajuste"].includes(tipo)) {
    return { ok: false, mensaje: "Tipo inválido" };
  }

  if (!cant || cant <= 0) {
    return { ok: false, mensaje: "Cantidad inválida" };
  }

  let stock_actual = stock_anterior;

  if (tipo === "entrada") stock_actual = stock_anterior + cant;
  if (tipo === "salida") {
    if (cant > stock_anterior) return { ok: false, mensaje: "Stock insuficiente" };
    stock_actual = stock_anterior - cant;
  }
  if (tipo === "ajuste") stock_actual = cant; // ajuste fija el stock exacto

  // Actualiza stock del producto
  await movimientosRepositorio.actualizarStockProducto(id_producto, stock_actual);

  // Registra movimiento
  const movimiento = await movimientosRepositorio.registrarMovimiento({
    id_producto,
    tipo,
    cantidad: cant,
    stock_anterior,
    stock_actual,
    id_usuario,
  });

  return { ok: true, movimiento };
}

module.exports = {
  obtenerMovimientos,
  crearMovimiento,
};
