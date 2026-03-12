const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const autenticacionRepositorio = require("./autenticacion.repositorio");

async function iniciarSesion(correo, contrasena, { ip, userAgent } = {}) {

  const correoNormalizado = (correo || "").toString().trim().toLowerCase();
  const usuario = await autenticacionRepositorio.buscarUsuarioPorCorreo(correoNormalizado);

  if (!usuario) {
    return { ok: false, mensaje: "Correo o contraseña incorrectos" };
  }

  if (!usuario.activo) {
    return { ok: false, mensaje: "Usuario desactivado" };
  }

  // Comparar contraseña
  // Si la contraseña en BD está en texto (por ahora), permitimos comparación simple
  let contrasenaValida = false;

  const pareceHash = usuario.contrasena.startsWith("$2a$") || usuario.contrasena.startsWith("$2b$");
  if (pareceHash) {
    contrasenaValida = await bcrypt.compare(contrasena, usuario.contrasena);
  } else {
    contrasenaValida = contrasena === usuario.contrasena;
  }

  if (!contrasenaValida) {
    return { ok: false, mensaje: "Correo o contraseña incorrectos" };
  }

  const payload = {
    id_usuario: usuario.id_usuario,
    nombre: usuario.nombre,
    correo: usuario.correo,
    id_rol: usuario.id_rol,
    rol: usuario.rol,
  };

  const token = jwt.sign(payload, process.env.JWT_SECRETO, { expiresIn: "8h" });

  await autenticacionRepositorio.registrarSesion({
    id_usuario: usuario.id_usuario,
    ip,
    user_agent: userAgent,
  });

  return {
    ok: true,
    mensaje: "Inicio de sesión exitoso",
    token,
    usuario: payload,
  };
}

module.exports = {
  iniciarSesion,
};
