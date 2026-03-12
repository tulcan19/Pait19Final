const pool = require("../../config/base_datos");

// Productos activos con info de categoría (público)
async function listarProductosActivos({ categoria, busqueda, limite, offset }) {
  let consulta = `
    SELECT 
      p.id_producto,
      p.nombre,
      p.descripcion,
      p.precio,
      p.stock,
      p.imagen,
      p.activo,
      c.id_categoria,
      c.nombre AS categoria_nombre
    FROM productos p
    LEFT JOIN categorias c ON c.id_categoria = p.id_categoria
    WHERE p.activo = true
  `;
  const valores = [];
  let idx = 1;

  if (categoria) {
    consulta += ` AND p.id_categoria = $${idx}`;
    valores.push(categoria);
    idx++;
  }

  if (busqueda) {
    consulta += ` AND (LOWER(p.nombre) LIKE $${idx} OR LOWER(p.descripcion) LIKE $${idx})`;
    valores.push(`%${busqueda.toLowerCase()}%`);
    idx++;
  }

  consulta += ` ORDER BY p.id_producto DESC`;

  if (limite) {
    consulta += ` LIMIT $${idx}`;
    valores.push(limite);
    idx++;
  }

  if (offset) {
    consulta += ` OFFSET $${idx}`;
    valores.push(offset);
    idx++;
  }

  const resultado = await pool.query(consulta, valores);
  return resultado.rows;
}

// Detalle de un producto activo
async function obtenerProductoPorId(id_producto) {
  const consulta = `
    SELECT 
      p.id_producto,
      p.nombre,
      p.descripcion,
      p.precio,
      p.stock,
      p.imagen,
      c.id_categoria,
      c.nombre AS categoria_nombre
    FROM productos p
    LEFT JOIN categorias c ON c.id_categoria = p.id_categoria
    WHERE p.id_producto = $1 AND p.activo = true
  `;
  const resultado = await pool.query(consulta, [id_producto]);
  return resultado.rows[0];
}

// Todas las categorías
async function listarCategorias() {
  const consulta = `
    SELECT 
      c.*, 
      COUNT(p.id_producto) AS total_productos,
      COALESCE(
        (SELECT json_agg(sub.* ORDER BY sub.id_subcategoria ASC)
         FROM (
           SELECT 
             s.id_subcategoria,
             COALESCE(c2.nombre, s.nombre) as nombre_final
           FROM subcategorias s
           LEFT JOIN categorias c2 ON c2.id_categoria = s.id_categoria_vinculada
           WHERE s.id_categoria = c.id_categoria AND s.activo = TRUE
         ) sub),
        '[]'
      ) as subcategorias
    FROM categorias c
    LEFT JOIN productos p ON p.id_categoria = c.id_categoria AND p.activo = true
    GROUP BY c.id_categoria
    ORDER BY c.nombre ASC
  `;
  const resultado = await pool.query(consulta);
  return resultado.rows;
}

// Productos destacados (los que tienen más stock o los más recientes)
async function listarDestacados(limite = 8) {
  const consulta = `
    SELECT 
      p.id_producto,
      p.nombre,
      p.descripcion,
      p.precio,
      p.stock,
      p.imagen,
      c.id_categoria,
      c.nombre AS categoria_nombre
    FROM productos p
    LEFT JOIN categorias c ON c.id_categoria = p.id_categoria
    WHERE p.activo = true AND p.stock > 0
    ORDER BY p.id_producto DESC
    LIMIT $1
  `;
  const resultado = await pool.query(consulta, [limite]);
  return resultado.rows;
}

// Contar total de productos activos (para paginación)
async function contarProductosActivos({ categoria, busqueda }) {
  let consulta = `SELECT COUNT(*) AS total FROM productos p WHERE p.activo = true`;
  const valores = [];
  let idx = 1;

  if (categoria) {
    consulta += ` AND p.id_categoria = $${idx}`;
    valores.push(categoria);
    idx++;
  }

  if (busqueda) {
    consulta += ` AND (LOWER(p.nombre) LIKE $${idx} OR LOWER(p.descripcion) LIKE $${idx})`;
    valores.push(`%${busqueda.toLowerCase()}%`);
    idx++;
  }

  const resultado = await pool.query(consulta, valores);
  return parseInt(resultado.rows[0].total);
}

module.exports = {
  listarProductosActivos,
  obtenerProductoPorId,
  listarCategorias,
  listarDestacados,
  contarProductosActivos,
};
