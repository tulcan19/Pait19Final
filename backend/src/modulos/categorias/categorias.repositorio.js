const pool = require("../../config/base_datos");

async function crearCategoria({ nombre, descripcion, imagen }) {
  const consulta = `
    INSERT INTO categorias (nombre, descripcion, imagen)
    VALUES ($1, $2, $3)
    RETURNING *
  `;
  const resultado = await pool.query(consulta, [
    nombre,
    descripcion || null,
    imagen || null,
  ]);
  return resultado.rows[0];
}

async function actualizarCategoria(id, { nombre, descripcion, imagen }) {
  const consulta = `
    UPDATE categorias
    SET nombre = $1, descripcion = $2, imagen = $3
    WHERE id_categoria = $4
    RETURNING *
  `;
  const resultado = await pool.query(consulta, [
    nombre,
    descripcion || null,
    imagen || null,
    id,
  ]);
  return resultado.rows[0];
}

async function listarCategorias() {
  const consulta = `
    SELECT 
      c.*,
      COALESCE(
        (SELECT json_agg(sub.* ORDER BY sub.id_subcategoria ASC)
         FROM (
           SELECT 
             s.*,
             c2.nombre as nombre_categoria_vinculada,
             COALESCE(c2.nombre, s.nombre) as nombre_final
           FROM subcategorias s
           LEFT JOIN categorias c2 ON c2.id_categoria = s.id_categoria_vinculada
           WHERE s.id_categoria = c.id_categoria AND s.activo = TRUE
         ) sub),
        '[]'
      ) as subcategorias
    FROM categorias c
    ORDER BY c.id_categoria DESC
  `;
  const resultado = await pool.query(consulta);
  return resultado.rows;
}

module.exports = {
  crearCategoria,
  actualizarCategoria,
  listarCategorias,
};
