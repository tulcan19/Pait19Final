/**
 * Middleware para validar imágenes
 * - Solo Admin y Supervisor pueden subir imágenes
 * - Si no hay imagen, permite continuar
 * - Si hay imagen, valida rol y tamaño
 */

function validarImagenSubida(req, res, next) {
  const usuario = req.usuario;
  const { imagen } = req.body;

  // Si no hay imagen en el request, está bien (es opcional)
  if (!imagen) {
    return next();
  }

  // Si hay imagen, verificar que el usuario sea Admin o Supervisor
  if (!usuario || !["Administrador", "Supervisor"].includes(usuario.rol)) {
    return res.status(403).json({
      mensaje: "⛔ Solo Admin y Supervisor pueden subir imágenes",
    });
  }

  next();
}

/**
 * Validar datos de imagen en el body (para base64 o URL)
 */
function validarDatosImagen(req, res, next) {
  const { imagen } = req.body;

  if (!imagen) {
    // Si no hay imagen, está ok (opcional)
    return next();
  }

  // Si viene una imagen, validar tamaño (máx 5MB para base64)
  if (typeof imagen === "string") {
    // Aproximado: base64 = 1.33x del tamaño original
    const sizeInBytes = Buffer.byteLength(imagen, "utf8");
    const maxSizeBytes = 5 * 1024 * 1024; // 5MB

    if (sizeInBytes > maxSizeBytes) {
      return res.status(400).json({
        mensaje: "⚠️ La imagen es muy grande (máximo 5MB)",
      });
    }
  }

  next();
}

module.exports = {
  validarImagenSubida,
  validarDatosImagen,
};
