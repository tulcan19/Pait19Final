const pool = require("../../config/base_datos");

async function listarClientes() {
  const res = await pool.query("SELECT * FROM clientes ORDER BY id_cliente");
  return res.rows;
}

async function crearCliente({ nombre, telefono, correo, cedula, direccion }) {
  try {
    const res = await pool.query(
      `INSERT INTO clientes (nombre, telefono, correo, cedula, direccion)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [nombre, telefono || null, correo || null, cedula || null, direccion || null]
    );
    return res.rows[0];
  } catch (e) {
    if (e.code === "42703") {
      const res = await pool.query(
        `INSERT INTO clientes (nombre, telefono, correo) VALUES ($1, $2, $3) RETURNING *`,
        [nombre, telefono || null, correo || null]
      );
      return res.rows[0];
    }
    throw e;
  }
}

async function editarCliente({ id_cliente, nombre, telefono, correo, cedula, direccion }) {
  try {
    const res = await pool.query(
      `UPDATE clientes
       SET nombre = $1, telefono = $2, correo = $3, cedula = $4, direccion = $5
       WHERE id_cliente = $6
       RETURNING *`,
      [nombre, telefono || null, correo || null, cedula || null, direccion || null, id_cliente]
    );
    return res.rows[0];
  } catch (e) {
    if (e.code === "42703") {
      const res = await pool.query(
        `UPDATE clientes SET nombre = $1, telefono = $2, correo = $3 WHERE id_cliente = $4 RETURNING *`,
        [nombre, telefono || null, correo || null, id_cliente]
      );
      return res.rows[0];
    }
    throw e;
  }
}

async function obtenerConsumidorFinal() {
  const res = await pool.query(
    `SELECT id_cliente FROM clientes WHERE nombre = 'Consumidor Final' AND activo = true LIMIT 1`
  );
  return res.rows[0]?.id_cliente || null;
}

async function cambiarEstadoCliente(id_cliente, activo) {
  const res = await pool.query(
    `UPDATE clientes
     SET activo = $1
     WHERE id_cliente = $2
     RETURNING *`,
    [activo, id_cliente]
  );

  return res.rows[0];
}

async function obtenerComprasCliente(id_cliente) {
  const res = await pool.query(
    `SELECT id_venta, fecha, total, metodo_pago, estado
     FROM ventas
     WHERE id_cliente = $1 AND estado != 'anulada'
     ORDER BY fecha DESC
     LIMIT 10`,
    [id_cliente]
  );
  return res.rows;
}

module.exports = {
  listarClientes,
  crearCliente,
  editarCliente,
  cambiarEstadoCliente,
  obtenerConsumidorFinal,
  obtenerComprasCliente,
};
