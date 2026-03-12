const pool = require("../../config/base_datos");

async function listarProveedores() {
  const consulta = `
    SELECT 
      pr.id_proveedor,
      pr.nombre,
      pr.telefono,
      pr.correo,
      pr.producto,
      pr.latitud,
      pr.longitud,
      pr.activo,
      pr.fecha_creacion,
      COUNT(DISTINCT p.id_producto) AS total_productos,
      COUNT(DISTINCT CASE WHEN p.activo = true THEN p.id_producto END) AS productos_activos
    FROM proveedores pr
    LEFT JOIN productos p ON p.id_proveedor = pr.id_proveedor
    GROUP BY pr.id_proveedor
    ORDER BY pr.nombre
  `;
  const res = await pool.query(consulta);
  return res.rows;
}

async function crearProveedor({ nombre, telefono, correo, producto, latitud, longitud }) {
  const res = await pool.query(
    `INSERT INTO proveedores (nombre, telefono, correo, producto, latitud, longitud)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [nombre, telefono || null, correo || null, producto || null, latitud || null, longitud || null]
  );
  return res.rows[0];
}

async function editarProveedor(id_proveedor, { nombre, telefono, correo, producto, latitud, longitud }) {
  const res = await pool.query(
    `UPDATE proveedores
     SET nombre = $1,
         telefono = $2,
         correo = $3,
         producto = $4,
         latitud = $5,
         longitud = $6
     WHERE id_proveedor = $7
     RETURNING *`,
    [nombre, telefono || null, correo || null, producto || null, latitud || null, longitud || null, id_proveedor]
  );

  return res.rows[0];
}

async function cambiarEstadoProveedor(id_proveedor, activo) {
  const res = await pool.query(
    `UPDATE proveedores
     SET activo = $1
     WHERE id_proveedor = $2
     RETURNING *`,
    [activo, id_proveedor]
  );

  return res.rows[0];
}

async function eliminarProveedorPermanentemente(id_proveedor) {
  const res = await pool.query(
    "DELETE FROM proveedores WHERE id_proveedor = $1 RETURNING *",
    [id_proveedor]
  );
  return res.rows[0];
}

async function obtenerProductosDelProveedor(id_proveedor) {
  const consulta = `
    SELECT 
      p.id_producto,
      p.nombre,
      p.descripcion,
      p.precio,
      p.stock,
      p.stock_minimo,
      p.activo,
      c.nombre AS categoria_nombre
    FROM productos p
    LEFT JOIN categorias c ON c.id_categoria = p.id_categoria
    WHERE p.id_proveedor = $1
    ORDER BY p.nombre
  `;
  const resultado = await pool.query(consulta, [id_proveedor]);
  return resultado.rows;
}

module.exports = {
  listarProveedores,
  crearProveedor,
  editarProveedor,
  cambiarEstadoProveedor,
  eliminarProveedorPermanentemente,
  obtenerProductosDelProveedor,
};
