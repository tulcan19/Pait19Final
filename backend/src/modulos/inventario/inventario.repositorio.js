const pool = require("../../config/base_datos");

async function obtenerProductoPorId(id_producto) {
  const consulta = `SELECT * FROM productos WHERE id_producto = $1 LIMIT 1`;
  const resultado = await pool.query(consulta, [id_producto]);
  return resultado.rows[0];
}

async function actualizarStockProducto(id_producto, nuevoStock) {
  const consulta = `
    UPDATE productos
    SET stock = $1
    WHERE id_producto = $2
    RETURNING *
  `;
  const resultado = await pool.query(consulta, [nuevoStock, id_producto]);
  return resultado.rows[0];
}

async function registrarMovimiento({ id_producto, tipo, cantidad, stock_anterior, stock_actual, id_usuario }) {
  const consulta = `
    INSERT INTO movimientos_inventario (id_producto, tipo, cantidad, stock_anterior, stock_actual, id_usuario)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `;
  const valores = [id_producto, tipo, cantidad, stock_anterior, stock_actual, id_usuario];
  const resultado = await pool.query(consulta, valores);
  return resultado.rows[0];
}

async function listarMovimientos() {
  const consulta = `
    SELECT m.*, p.nombre AS producto, u.nombre AS usuario
    FROM movimientos_inventario m
    INNER JOIN productos p ON p.id_producto = m.id_producto
    INNER JOIN usuarios u ON u.id_usuario = m.id_usuario
    ORDER BY m.id_movimiento DESC
  `;
  const resultado = await pool.query(consulta);
  return resultado.rows;
}

module.exports = {
  obtenerProductoPorId,
  actualizarStockProducto,
  registrarMovimiento,
  listarMovimientos,
};
