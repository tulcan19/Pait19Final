const pool = require("../../config/base_datos");

async function crearGasto({ concepto, monto, observacion, categoria, id_usuario }) {
  try {
    const consulta = `
      INSERT INTO gastos (concepto, monto, observacion, categoria, id_usuario)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const valores = [concepto, monto, observacion || null, categoria || null, id_usuario];
    const resultado = await pool.query(consulta, valores);
    return resultado.rows[0];
  } catch (e) {
    if (e.code === "42703") {
      const consulta2 = `
        INSERT INTO gastos (concepto, monto, observacion, id_usuario)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;
      const resultado = await pool.query(consulta2, [concepto, monto, observacion || null, id_usuario]);
      return { ...resultado.rows[0], categoria: null };
    }
    throw e;
  }
}

async function listarGastos() {
  try {
    const consulta = `
      SELECT g.id_gasto, g.concepto, g.monto, g.fecha, g.observacion, g.categoria, g.id_usuario, u.nombre AS usuario
      FROM gastos g
      INNER JOIN usuarios u ON u.id_usuario = g.id_usuario
      ORDER BY g.id_gasto DESC
    `;
    const resultado = await pool.query(consulta);
    return resultado.rows;
  } catch (e) {
    if (e.code === "42703") {
      const consulta2 = `
        SELECT g.*, u.nombre AS usuario FROM gastos g
        INNER JOIN usuarios u ON u.id_usuario = g.id_usuario
        ORDER BY g.id_gasto DESC
      `;
      const resultado = await pool.query(consulta2);
      return resultado.rows.map((r) => ({ ...r, categoria: null }));
    }
    throw e;
  }
}

module.exports = {
  crearGasto,
  listarGastos,
};
