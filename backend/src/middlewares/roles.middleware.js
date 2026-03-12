function permitirRoles(...rolesPermitidos) {
  return (req, res, next) => {
    const usuario = req.usuario;

    if (!usuario) {
      return res.status(401).json({ mensaje: "No autenticado" });
    }

    const rolUsuario = usuario.rol;

    if (!rolesPermitidos.includes(rolUsuario)) {
      return res.status(403).json({
        mensaje: "Acceso denegado. No tienes permisos para esta acción",
      });
    }

    next();
  };
}

module.exports = {
  permitirRoles,
};
