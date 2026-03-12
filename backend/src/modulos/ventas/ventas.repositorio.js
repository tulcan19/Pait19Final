const pool = require("../../config/base_datos");

// 1) Crear venta (cabecera)
async function crearVenta(client, { id_cliente, total, id_usuario, metodo_pago }) {
  try {
    const sql = `
      INSERT INTO ventas (id_cliente, total, id_usuario, estado, metodo_pago)
      VALUES ($1, $2, $3, 'registrada', $4)
      RETURNING *;
    `;
    const { rows } = await client.query(sql, [id_cliente, total, id_usuario, metodo_pago || "efectivo"]);
    return rows[0];
  } catch (e) {
    if (e.code === "42703") {
      const sql2 = `INSERT INTO ventas (id_cliente, total, id_usuario, estado) VALUES ($1, $2, $3, 'registrada') RETURNING *;`;
      const { rows } = await client.query(sql2, [id_cliente, total, id_usuario]);
      return rows[0];
    }
    throw e;
  }
}

// 2) Insertar detalle venta
async function insertarDetalle(client, { id_venta, id_producto, cantidad, precio, subtotal }) {
  const sql = `
    INSERT INTO detalle_venta (id_venta, id_producto, cantidad, precio, subtotal)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;
  const { rows } = await client.query(sql, [id_venta, id_producto, cantidad, precio, subtotal]);
  return rows[0];
}

// 3) Obtener producto
async function obtenerProducto(client, id_producto) {
  const sql = `SELECT * FROM productos WHERE id_producto = $1 LIMIT 1;`;
  const { rows } = await client.query(sql, [id_producto]);
  return rows[0];
}

// 4) Actualizar stock
async function actualizarStock(client, id_producto, stock_actual) {
  const sql = `UPDATE productos SET stock = $1 WHERE id_producto = $2 RETURNING *;`;
  const { rows } = await client.query(sql, [stock_actual, id_producto]);
  return rows[0];
}

// 5) Registrar movimiento salida
async function registrarMovimiento(client, { id_producto, tipo, cantidad, stock_anterior, stock_actual, id_usuario }) {
  const sql = `
    INSERT INTO movimientos_inventario (id_producto, tipo, cantidad, stock_anterior, stock_actual, id_usuario)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *;
  `;
  const { rows } = await client.query(sql, [
    id_producto,
    tipo,
    cantidad,
    stock_anterior,
    stock_actual,
    id_usuario,
  ]);
  return rows[0];
}

// 6) Listar ventas
async function listarVentas() {
  const sql = `
    SELECT v.id_venta, v.fecha, v.total, v.estado,
           c.nombre AS cliente,
           u.nombre AS usuario
    FROM ventas v
    LEFT JOIN clientes c ON c.id_cliente = v.id_cliente
    LEFT JOIN usuarios u ON u.id_usuario = v.id_usuario
    ORDER BY v.id_venta DESC;
  `;
  const { rows } = await pool.query(sql);
  return rows;
}

// 7) Detalle venta
async function detalleVenta(id_venta) {
  const cabeceraSql = `
    SELECT v.id_venta, v.fecha, v.total, v.estado,
           c.id_cliente, c.nombre AS cliente,
           u.id_usuario, u.nombre AS usuario
    FROM ventas v
    LEFT JOIN clientes c ON c.id_cliente = v.id_cliente
    LEFT JOIN usuarios u ON u.id_usuario = v.id_usuario
    WHERE v.id_venta = $1;
  `;

  const detalleSql = `
    SELECT d.id_detalle, d.id_producto, p.nombre, p.imagen, d.cantidad, d.precio, d.subtotal
    FROM detalle_venta d
    JOIN productos p ON p.id_producto = d.id_producto
    WHERE d.id_venta = $1
    ORDER BY d.id_detalle ASC;
  `;

  const cab = await pool.query(cabeceraSql, [id_venta]);
  const cabecera = cab.rows[0] || null;
  if (cabecera) {
    try {
      const mp = await pool.query("SELECT metodo_pago FROM ventas WHERE id_venta = $1", [id_venta]);
      cabecera.metodo_pago = mp.rows[0]?.metodo_pago || "efectivo";
    } catch (_) {
      cabecera.metodo_pago = "efectivo";
    }
  }
  const det = await pool.query(detalleSql, [id_venta]);

  return { cabecera, detalle: det.rows };
}

// 8) Obtener detalle de venta (para anular)
async function obtenerDetallePorVenta(id_venta) {
  const sql = `SELECT id_producto, cantidad FROM detalle_venta WHERE id_venta = $1`;
  const { rows } = await pool.query(sql, [id_venta]);
  return rows;
}

// 9) Actualizar estado venta
async function actualizarEstadoVenta(client, id_venta, estado) {
  const sql = `UPDATE ventas SET estado = $1 WHERE id_venta = $2 RETURNING *`;
  const { rows } = await client.query(sql, [estado, id_venta]);
  return rows[0];
}

module.exports = {
  pool,
  crearVenta,
  insertarDetalle,
  obtenerProducto,
  actualizarStock,
  registrarMovimiento,
  listarVentas,
  detalleVenta,
  obtenerDetallePorVenta,
  actualizarEstadoVenta,
};
