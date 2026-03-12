const pool = require("../../config/base_datos");

// 1) crear compra (cabecera)
async function crearCompra(client, { id_proveedor, total, id_usuario }) {
  const sql = `
    INSERT INTO compras (id_proveedor, total, id_usuario, estado)
    VALUES ($1, $2, $3, 'registrada')
    RETURNING *;
  `;
  const { rows } = await client.query(sql, [id_proveedor, total, id_usuario]);
  return rows[0];
}

// 2) insertar detalle compra
async function insertarDetalle(client, { id_compra, id_producto, cantidad, costo, subtotal }) {
  const sql = `
    INSERT INTO detalle_compra (id_compra, id_producto, cantidad, costo, subtotal)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;
  const { rows } = await client.query(sql, [id_compra, id_producto, cantidad, costo, subtotal]);
  return rows[0];
}

// 3) obtener producto
async function obtenerProducto(client, id_producto) {
  const sql = `SELECT * FROM productos WHERE id_producto = $1 LIMIT 1;`;
  const { rows } = await client.query(sql, [id_producto]);
  return rows[0];
}

// 4) actualizar stock (SUMA)
async function actualizarStock(client, id_producto, stock_actual) {
  const sql = `UPDATE productos SET stock = $1 WHERE id_producto = $2 RETURNING *;`;
  const { rows } = await client.query(sql, [stock_actual, id_producto]);
  return rows[0];
}

// 5) registrar movimiento entrada
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

// 6) listar compras
async function listarCompras() {
  const sql = `
    SELECT c.id_compra, c.fecha, c.total, c.estado,
           p.nombre AS proveedor,
           u.nombre AS usuario
    FROM compras c
    LEFT JOIN proveedores p ON p.id_proveedor = c.id_proveedor
    LEFT JOIN usuarios u ON u.id_usuario = c.id_usuario
    ORDER BY c.id_compra DESC;
  `;
  const { rows } = await pool.query(sql);
  return rows;
}

// 7) detalle compra
async function detalleCompra(id_compra) {
  const cabeceraSql = `
    SELECT c.id_compra, c.fecha, c.total, c.estado,
           p.id_proveedor, p.nombre AS proveedor,
           u.id_usuario, u.nombre AS usuario
    FROM compras c
    LEFT JOIN proveedores p ON p.id_proveedor = c.id_proveedor
    LEFT JOIN usuarios u ON u.id_usuario = c.id_usuario
    WHERE c.id_compra = $1;
  `;

  const detalleSql = `
SELECT d.id_detalle, d.id_producto, pr.nombre, pr.imagen, d.cantidad, d.costo, d.subtotal
    FROM detalle_compra d
    JOIN productos pr ON pr.id_producto = d.id_producto
    WHERE d.id_compra = $1
    ORDER BY d.id_detalle ASC;
  `;

  const cab = await pool.query(cabeceraSql, [id_compra]);
  const det = await pool.query(detalleSql, [id_compra]);

  return { cabecera: cab.rows[0], detalle: det.rows };
}

module.exports = {
  pool,
  crearCompra,
  insertarDetalle,
  obtenerProducto,
  actualizarStock,
  registrarMovimiento,
  listarCompras,
  detalleCompra,
};
