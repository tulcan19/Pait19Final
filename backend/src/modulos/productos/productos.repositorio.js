const pool = require("../../config/base_datos");

async function crearProducto({ nombre, descripcion, precio, stock, stock_minimo, id_categoria, id_subcategoria, id_proveedor, imagen }) {
  const consulta = `
    INSERT INTO productos (nombre, descripcion, precio, stock, stock_minimo, id_categoria, id_subcategoria, id_proveedor, imagen)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *
  `;
  const valores = [
    nombre,
    descripcion || null,
    precio,
    stock || 0,
    stock_minimo || 0,
    id_categoria,
    id_subcategoria || null,
    id_proveedor || null,
    imagen || null
  ];
  const resultado = await pool.query(consulta, valores);
  return resultado.rows[0];
}

async function listarProductos() {
  const consulta = `
    SELECT 
      p.*,
      c.id_categoria,
      c.nombre AS categoria_nombre,
      c.descripcion AS categoria_descripcion,
      COALESCE(cs.nombre, s.nombre) AS subcategoria_nombre,
      pr.id_proveedor,
      pr.nombre AS proveedor_nombre,
      pr.telefono AS proveedor_telefono,
      pr.correo AS proveedor_correo,
      pr.activo AS proveedor_activo
    FROM productos p
    LEFT JOIN categorias c ON c.id_categoria = p.id_categoria
    LEFT JOIN subcategorias s ON s.id_subcategoria = p.id_subcategoria
    LEFT JOIN categorias cs ON cs.id_categoria = s.id_categoria_vinculada
    LEFT JOIN proveedores pr ON pr.id_proveedor = p.id_proveedor
    ORDER BY p.id_producto DESC
  `;
  const resultado = await pool.query(consulta);
  return resultado.rows;
}

async function actualizarProducto(id_producto, { nombre, descripcion, precio, stock, stock_minimo, id_categoria, id_subcategoria, id_proveedor, imagen }) {
  const consulta = `
    UPDATE productos
    SET nombre = $1,
        descripcion = $2,
        precio = $3,
        stock = $4,
        stock_minimo = $5,
        id_categoria = $6,
        id_subcategoria = $7,
        id_proveedor = $8,
        imagen = $9
    WHERE id_producto = $10
    RETURNING *
  `;
  const valores = [
    nombre,
    descripcion || null,
    precio,
    stock,
    stock_minimo || 0,
    id_categoria,
    id_subcategoria || null,
    id_proveedor || null,
    imagen || null,
    id_producto
  ];
  const resultado = await pool.query(consulta, valores);
  return resultado.rows[0];
}

async function desactivarProducto(id_producto) {
  const consulta = `
    UPDATE productos
    SET activo = FALSE
    WHERE id_producto = $1
    RETURNING *
  `;
  const resultado = await pool.query(consulta, [id_producto]);
  return resultado.rows[0];
}

async function existeProducto(id_producto) {
  const consulta = `SELECT id_producto FROM productos WHERE id_producto = $1 LIMIT 1`;
  const resultado = await pool.query(consulta, [id_producto]);
  return resultado.rows[0];
}
async function activarProducto(id_producto) {
  const sql = `
    UPDATE productos
    SET activo = true
    WHERE id_producto = $1
    RETURNING *;
  `;

  const { rows } = await pool.query(sql, [id_producto]);
  return rows[0];
}


async function obtenerProductosPorProveedor(id_proveedor) {
  const consulta = `
    SELECT 
      p.*,
      c.nombre AS categoria_nombre
    FROM productos p
    LEFT JOIN categorias c ON c.id_categoria = p.id_categoria
    WHERE p.id_proveedor = $1
    ORDER BY p.nombre
  `;
  const resultado = await pool.query(consulta, [id_proveedor]);
  return resultado.rows;
}

async function obtenerProveedoresDeProducto(id_producto) {
  const consulta = `
    SELECT 
      pr.*,
      pp.precio_compra,
      pp.es_principal
    FROM proveedor_producto pp
    INNER JOIN proveedores pr ON pr.id_proveedor = pp.id_proveedor
    WHERE pp.id_producto = $1
    UNION
    SELECT 
      pr.*,
      NULL AS precio_compra,
      true AS es_principal
    FROM productos p
    INNER JOIN proveedores pr ON pr.id_proveedor = p.id_proveedor
    WHERE p.id_producto = $1 AND p.id_proveedor IS NOT NULL
    ORDER BY es_principal DESC, nombre
  `;
  const resultado = await pool.query(consulta, [id_producto]);
  return resultado.rows;
}

async function eliminarProducto(id_producto) {
  const consulta = `DELETE FROM productos WHERE id_producto = $1 RETURNING *`;
  const resultado = await pool.query(consulta, [id_producto]);
  return resultado.rows[0];
}

async function crearProductosMasivos(productos) {
  // Construcción manual de inserción masiva para PostgreSQL
  // Formato: INSERT INTO tabla (col1, col2) VALUES ($1, $2), ($3, $4), ...
  const columnas = ['nombre', 'descripcion', 'precio', 'stock', 'stock_minimo', 'id_categoria', 'id_subcategoria', 'id_proveedor', 'imagen'];
  const valores = [];
  const marcadores = [];

  productos.forEach((p, i) => {
    const offset = i * columnas.length;
    const filaMarcadores = columnas.map((_, colIdx) => `$${offset + colIdx + 1}`).join(', ');
    marcadores.push(`(${filaMarcadores})`);

    valores.push(
      p.nombre,
      p.descripcion || null,
      p.precio,
      p.stock || 0,
      p.stock_minimo || 0,
      p.id_categoria,
      p.id_subcategoria || null,
      p.id_proveedor || null,
      p.imagen || null
    );
  });

  const consulta = `
    INSERT INTO productos (${columnas.join(', ')})
    VALUES ${marcadores.join(', ')}
    RETURNING *
  `;

  const resultado = await pool.query(consulta, valores);
  return resultado.rows;
}

module.exports = {
  crearProducto,
  listarProductos,
  actualizarProducto,
  desactivarProducto,
  existeProducto,
  activarProducto,
  obtenerProductosPorProveedor,
  obtenerProveedoresDeProducto,
  eliminarProducto,
  crearProductosMasivos,
};
