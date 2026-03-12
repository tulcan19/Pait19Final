const pool = require("../../config/base_datos");

const DOMINIO_PERMITIDO = "@sierrastock.com";

function validarCorreoSierraStock(correo) {
  if (typeof correo !== "string") return false;
  return correo.toLowerCase().trim().endsWith(DOMINIO_PERMITIDO);
}

async function buscarUsuarioPorCorreo(correo) {
  const consulta = `
    SELECT u.id_usuario, u.nombre, u.correo, u.contrasena, u.activo,
           r.id_rol, r.nombre AS rol
    FROM usuarios u
    INNER JOIN roles r ON r.id_rol = u.id_rol
    WHERE LOWER(TRIM(u.correo)) = LOWER(TRIM($1))
    LIMIT 1
  `;
  const resultado = await pool.query(consulta, [correo]);
  return resultado.rows[0];
}

async function registrarSesion({ id_usuario, ip, user_agent }) {
  const consulta = `
    INSERT INTO historial_sesiones (id_usuario, ip, user_agent)
    VALUES ($1, $2, $3)
    RETURNING *
  `;
  try {
    const resultado = await pool.query(consulta, [id_usuario, ip || null, user_agent || null]);
    return resultado.rows[0];
  } catch (err) {
    if (err.code === "42P01") return null;
    throw err;
  }
}

module.exports = {
  buscarUsuarioPorCorreo,
  registrarSesion,
  validarCorreoSierraStock,
};
