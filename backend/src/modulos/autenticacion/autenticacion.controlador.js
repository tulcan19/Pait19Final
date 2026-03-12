const autenticacionServicio = require("./autenticacion.servicio");

async function login(req, res) {
  try {
    const { correo, contrasena } = req.body;

    if (!correo || !contrasena) {
      return res.status(400).json({ mensaje: "Correo y contraseña son obligatorios" });
    }

    const ip = req.ip || req.connection?.remoteAddress;
    const userAgent = req.get("user-agent");
    const resultado = await autenticacionServicio.iniciarSesion(correo, contrasena, { ip, userAgent });

    if (!resultado.ok) {
      return res.status(401).json({ mensaje: resultado.mensaje });
    }

    return res.json(resultado);
  } catch (error) {
    console.error("Error en login:", error);
    return res.status(500).json({ mensaje: "Error interno del servidor" });
  }
}

async function registro(req, res) {
  try {
    const { nombre, correo, contrasena } = req.body;
    const usuariosServicio = require("../usuarios/usuarios.servicio"); // Avoiding circular dependency if any

    const resultado = await usuariosServicio.registrarClientePublico({ nombre, correo, contrasena });

    if (!resultado.ok) {
      return res.status(400).json({ mensaje: resultado.mensaje });
    }

    // Auto-login after registration or just return success
    return res.status(201).json({
      ok: true,
      mensaje: "Registro exitoso. Ya puedes iniciar sesión.",
      usuario: resultado.usuario
    });
  } catch (error) {
    console.error("Error en registro:", error);
    return res.status(500).json({ mensaje: "Error interno del servidor" });
  }
}

module.exports = {
  login,
  registro,
};
