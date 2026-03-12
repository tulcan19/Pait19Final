const pool = require("../../config/base_datos");

// ====== VENTAS (cabecera + detalle) ======
async function obtenerVentaCabecera(id_venta) {
  const sql = `
    SELECT v.id_venta, v.fecha, v.total, v.estado,
           c.id_cliente, c.nombre AS cliente,
           u.id_usuario, u.nombre AS usuario
    FROM ventas v
    LEFT JOIN clientes c ON c.id_cliente = v.id_cliente
    LEFT JOIN usuarios u ON u.id_usuario = v.id_usuario
    WHERE v.id_venta = $1;
  `;
  const { rows } = await pool.query(sql, [id_venta]);
  return rows[0];
}

async function obtenerVentaDetalle(id_venta) {
  const sql = `
    SELECT d.id_detalle, d.id_producto, p.nombre,
           d.cantidad, d.precio, d.subtotal
    FROM detalle_venta d
    JOIN productos p ON p.id_producto = d.id_producto
    WHERE d.id_venta = $1
    ORDER BY d.id_detalle ASC;
  `;
  const { rows } = await pool.query(sql, [id_venta]);
  return rows;
}

// ====== MOVIMIENTOS (kardex) ======
async function listarMovimientos({ tipo, id_producto }) {
  let sql = `
    SELECT m.id_movimiento, m.fecha, m.tipo, m.cantidad,
           m.stock_anterior, m.stock_actual,
           p.nombre AS producto,
           u.nombre AS usuario,
           m.id_producto
    FROM movimientos_inventario m
    LEFT JOIN productos p ON p.id_producto = m.id_producto
    LEFT JOIN usuarios u ON u.id_usuario = m.id_usuario
    WHERE 1=1
  `;
  const params = [];

  if (tipo && ["entrada", "salida", "ajuste"].includes(tipo)) {
    params.push(tipo);
    sql += ` AND m.tipo = $${params.length}`;
  }

  if (id_producto) {
    params.push(Number(id_producto));
    sql += ` AND m.id_producto = $${params.length}`;
  }

  sql += ` ORDER BY m.id_movimiento DESC;`;

  const { rows } = await pool.query(sql, params);
  return rows;
}
async function obtenerNombreProducto(id_producto) {
  const { rows } = await pool.query(
    "SELECT nombre FROM productos WHERE id_producto = $1 LIMIT 1",
    [Number(id_producto)]
  );
  return rows[0]?.nombre || null;
}

module.exports = {
  obtenerVentaCabecera,
  obtenerVentaDetalle,
  listarMovimientos,
  obtenerNombreProducto,
};

