const usuariosServicio = require("./usuarios.servicio");

function verPerfil(req, res) {
  return res.json({
    mensaje: "✅ Acceso permitido",
    usuario: req.usuario,
  });
}

async function crear(req, res) {
  try {
    const { nombre, correo, contrasena, id_rol, rol } = req.body;

    if (!nombre || !correo || !contrasena) {
      return res.status(400).json({ mensaje: "Faltan datos obligatorios" });
    }

    const resultado = await usuariosServicio.registrarUsuario({
      nombre,
      correo,
      contrasena,
      id_rol,
      rol,
    });

    if (!resultado.ok) {
      return res.status(400).json({ mensaje: resultado.mensaje });
    }

    return res.status(201).json({
      mensaje: "✅ Usuario creado correctamente",
      usuario: resultado.usuario,
    });
  } catch (error) {
    console.error("Error al crear usuario:", error);
    return res.status(500).json({ mensaje: "Error interno del servidor" });
  }
}

async function listar(req, res) {
  try {
    const resultado = await usuariosServicio.listarUsuarios();
    return res.json(resultado);
  } catch (error) {
    console.error("Error al listar usuarios:", error);
    return res.status(500).json({ mensaje: "Error interno del servidor" });
  }
}

async function actualizar(req, res) {
  try {
    const { id_usuario } = req.params;
    const { nombre, correo, id_rol, rol, contrasena } = req.body;

    if (!nombre || !correo) {
      return res.status(400).json({ mensaje: "Faltan datos obligatorios" });
    }

    const resultado = await usuariosServicio.actualizarUsuario({
      id_usuario,
      nombre,
      correo,
      id_rol,
      rol,
      contrasena,
    });

    if (!resultado.ok) {
      return res.status(400).json({ mensaje: resultado.mensaje });
    }

    return res.json({
      mensaje: "✅ Usuario actualizado",
      usuario: resultado.usuario,
    });
  } catch (error) {
    console.error("Error al actualizar usuario:", error);
    return res.status(500).json({ mensaje: "Error interno del servidor" });
  }
}

async function desactivar(req, res) {
  try {
    const { id_usuario } = req.params;
    const resultado = await usuariosServicio.desactivarUsuario({ id_usuario });

    if (!resultado.ok) {
      return res.status(400).json({ mensaje: resultado.mensaje });
    }

    return res.json({
      mensaje: "✅ Usuario desactivado",
      usuario: resultado.usuario,
    });
  } catch (error) {
    console.error("Error al desactivar usuario:", error);
    return res.status(500).json({ mensaje: "Error interno del servidor" });
  }
}

async function activar(req, res) {
  try {
    const { id_usuario } = req.params;
    const resultado = await usuariosServicio.activarUsuario({ id_usuario });

    if (!resultado.ok) {
      return res.status(400).json({ mensaje: resultado.mensaje });
    }

    return res.json({
      mensaje: "✅ Usuario activado",
      usuario: resultado.usuario,
    });
  } catch (error) {
    console.error("Error al activar usuario:", error);
    return res.status(500).json({ mensaje: "Error interno del servidor" });
  }
}

async function eliminar(req, res) {
  try {
    const { id_usuario } = req.params;
    const resultado = await usuariosServicio.eliminarUsuario({ id_usuario });

    if (!resultado.ok) {
      return res.status(400).json({ mensaje: resultado.mensaje });
    }

    return res.json({
      mensaje: "✅ Usuario eliminado definitivamente",
    });
  } catch (error) {
    console.error("Error al eliminar usuario:", error);
    return res.status(500).json({ mensaje: "Error interno del servidor" });
  }
}

module.exports = {
  verPerfil,
  crear,
  listar,
  actualizar,
  desactivar,
  activar,
  eliminar,
};
