const pool = require("../../config/base_datos");

async function crearUsuario({ nombre, correo, contrasenaHash, id_rol }) {
  const consulta = `
    INSERT INTO usuarios (nombre, correo, contrasena, id_rol)
    VALUES ($1, $2, $3, $4)
    RETURNING id_usuario, nombre, correo, id_rol, activo, fecha_creacion
  `;
  const valores = [nombre, correo, contrasenaHash, id_rol];
  const resultado = await pool.query(consulta, valores);
  return resultado.rows[0];
}

async function obtenerRolPorId(id_rol) {
  const consulta = `SELECT id_rol, nombre FROM roles WHERE id_rol = $1 LIMIT 1`;
  const resultado = await pool.query(consulta, [id_rol]);
  return resultado.rows[0] || null;
}

async function obtenerIdRolPorNombre(nombreRol) {
  const consulta = `SELECT id_rol, nombre FROM roles WHERE LOWER(nombre) = LOWER($1) LIMIT 1`;
  const resultado = await pool.query(consulta, [nombreRol]);
  return resultado.rows[0] || null;
}

async function obtenerOCrearRolPorNombre(nombreRol) {
  // 1) Intentar obtener
  let rol = await obtenerIdRolPorNombre(nombreRol);
  if (rol) return rol;

  // 2) Crear si no existe
  const insertar = `
    INSERT INTO roles (nombre)
    VALUES ($1)
    RETURNING id_rol, nombre
  `;
  const resultado = await pool.query(insertar, [nombreRol]);
  return resultado.rows[0];
}

async function buscarPorCorreo(correo) {
  const consulta = `SELECT id_usuario FROM usuarios WHERE correo = $1 LIMIT 1`;
  const resultado = await pool.query(consulta, [correo]);
  return resultado.rows[0];
}

async function listarUsuariosPermitidos() {
  const consulta = `
    SELECT u.id_usuario, u.nombre, u.correo, u.id_rol, u.activo, u.fecha_creacion, r.nombre AS rol
    FROM usuarios u
    INNER JOIN roles r ON r.id_rol = u.id_rol
    WHERE r.nombre IN ('Supervisor', 'Operador', 'Cliente')
    ORDER BY u.id_usuario DESC
  `;
  const resultado = await pool.query(consulta);
  return resultado.rows;
}

async function actualizarUsuario({ id_usuario, nombre, correo, id_rol }) {
  const consulta = `
    UPDATE usuarios
    SET nombre = $1,
        correo = $2,
        id_rol = $3
    WHERE id_usuario = $4
    RETURNING id_usuario, nombre, correo, id_rol, activo, fecha_creacion
  `;
  const valores = [nombre, correo, id_rol, id_usuario];
  const resultado = await pool.query(consulta, valores);
  return resultado.rows[0];
}

async function actualizarUsuarioConPassword({ id_usuario, nombre, correo, id_rol, contrasenaHash }) {
  const consulta = `
    UPDATE usuarios
    SET nombre = $1,
        correo = $2,
        id_rol = $3,
        contrasena = $4
    WHERE id_usuario = $5
    RETURNING id_usuario, nombre, correo, id_rol, activo, fecha_creacion
  `;
  const valores = [nombre, correo, id_rol, contrasenaHash, id_usuario];
  const resultado = await pool.query(consulta, valores);
  return resultado.rows[0];
}

async function desactivarUsuario(id_usuario) {
  const consulta = `
    UPDATE usuarios
    SET activo = FALSE
    WHERE id_usuario = $1
    RETURNING id_usuario, nombre, correo, id_rol, activo
  `;
  const resultado = await pool.query(consulta, [id_usuario]);
  return resultado.rows[0];
}

async function activarUsuario(id_usuario) {
  const consulta = `
    UPDATE usuarios
    SET activo = TRUE
    WHERE id_usuario = $1
    RETURNING id_usuario, nombre, correo, id_rol, activo
  `;
  const resultado = await pool.query(consulta, [id_usuario]);
  return resultado.rows[0];
}

async function eliminarUsuario(id_usuario) {
  const consulta = `
    DELETE FROM usuarios
    WHERE id_usuario = $1
    RETURNING id_usuario
  `;
  const resultado = await pool.query(consulta, [id_usuario]);
  return resultado.rows[0];
}

module.exports = {
  crearUsuario,
  buscarPorCorreo,
  obtenerRolPorId,
  obtenerIdRolPorNombre,
  obtenerOCrearRolPorNombre,
  listarUsuariosPermitidos,
  actualizarUsuario,
  actualizarUsuarioConPassword,
  desactivarUsuario,
  activarUsuario,
  eliminarUsuario,
};
