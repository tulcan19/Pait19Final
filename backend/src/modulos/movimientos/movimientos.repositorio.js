const pool = require("../../config/base_datos");

async function listarMovimientos() {
  const sql = `
    SELECT 
      m.id_movimiento,
      m.id_producto,
      m.tipo,
      m.cantidad,
      m.stock_anterior,
      m.stock_actual,
      m.fecha,
      m.id_usuario,
      p.nombre AS producto,
      p.imagen,
      u.nombre AS usuario
    FROM movimientos_inventario m
    INNER JOIN productos p ON p.id_producto = m.id_producto
    INNER JOIN usuarios u ON u.id_usuario = m.id_usuario
    ORDER BY m.fecha DESC;
  `;

  const { rows } = await pool.query(sql);
  return rows;
}

async function obtenerProductoPorId(id_producto) {
  const sql = `SELECT * FROM productos WHERE id_producto = $1;`;
  const { rows } = await pool.query(sql, [id_producto]);
  return rows[0];
}

async function actualizarStockProducto(id_producto, nuevo_stock) {
  const sql = `
    UPDATE productos
    SET stock = $1
    WHERE id_producto = $2
    RETURNING *;
  `;
  const { rows } = await pool.query(sql, [nuevo_stock, id_producto]);
  return rows[0];
}

async function registrarMovimiento(datos) {
  const sql = `
    INSERT INTO movimientos_inventario
      (id_producto, tipo, cantidad, stock_anterior, stock_actual, id_usuario)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *;
  `;

  const { rows } = await pool.query(sql, [
    datos.id_producto,
    datos.tipo,
    datos.cantidad,
    datos.stock_anterior,
    datos.stock_actual,
    datos.id_usuario,
  ]);

  return rows[0];
}

module.exports = {
  listarMovimientos,
  obtenerProductoPorId,
  actualizarStockProducto,
  registrarMovimiento,
};
