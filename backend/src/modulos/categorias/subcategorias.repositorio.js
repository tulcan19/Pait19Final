const pool = require("../../config/base_datos");

async function crearSubcategoria({ id_categoria, nombre, id_categoria_vinculada }) {
  const consulta = `
    INSERT INTO subcategorias (id_categoria, nombre, id_categoria_vinculada)
    VALUES ($1, $2, $3)
    RETURNING *
  `;
  const resultado = await pool.query(consulta, [id_categoria, nombre, id_categoria_vinculada || null]);
  return resultado.rows[0];
}

async function listarSubcategoriasPorCategoria(id_categoria) {
  const consulta = `
    SELECT * FROM subcategorias 
    WHERE id_categoria = $1 AND activo = TRUE 
    ORDER BY id_subcategoria ASC
  `;
  const resultado = await pool.query(consulta, [id_categoria]);
  return resultado.rows;
}

async function actualizarSubcategoria(id, { nombre, activo, id_categoria_vinculada }) {
  const consulta = `
    UPDATE subcategorias
    SET nombre = COALESCE($1, nombre),
        activo = COALESCE($2, activo),
        id_categoria_vinculada = COALESCE($3, id_categoria_vinculada)
    WHERE id_subcategoria = $4
    RETURNING *
  `;
  const resultado = await pool.query(consulta, [nombre, activo, id_categoria_vinculada || null, id]);
  return resultado.rows[0];
}

async function eliminarSubcategoria(id) {
  const consulta = `DELETE FROM subcategorias WHERE id_subcategoria = $1 RETURNING *`;
  const resultado = await pool.query(consulta, [id]);
  return resultado.rows[0];
}

module.exports = {
  crearSubcategoria,
  listarSubcategoriasPorCategoria,
  actualizarSubcategoria,
  eliminarSubcategoria,
};
