const express = require("express");
const router = express.Router();

const usuariosControlador = require("../modulos/usuarios/usuarios.controlador");

const { verificarToken } = require("../middlewares/autenticacion.middleware");
const { permitirRoles } = require("../middlewares/roles.middleware");

// Ruta protegida: cualquiera logueado puede entrar
router.get("/perfil", verificarToken, usuariosControlador.verPerfil);

// Ruta protegida SOLO admin
router.get("/solo-admin", verificarToken, permitirRoles("Administrador"), (req, res) => {
  res.json({ mensaje: "✅ Solo Administrador puede ver esto" });
});

// Crear usuario (solo Admin)
router.post(
  "/crear",
  verificarToken,
  permitirRoles("Administrador"),
  usuariosControlador.crear
);

// Listar usuarios (solo Admin)
router.get(
  "/",
  verificarToken,
  permitirRoles("Administrador"),
  usuariosControlador.listar
);

// Actualizar usuario (solo Admin, solo roles Supervisor/Operador)
router.put(
  "/:id_usuario",
  verificarToken,
  permitirRoles("Administrador"),
  usuariosControlador.actualizar
);

// Desactivar usuario (solo Admin)
router.delete(
  "/:id_usuario",
  verificarToken,
  permitirRoles("Administrador"),
  usuariosControlador.desactivar
);

// Activar usuario (solo Admin)
router.patch(
  "/:id_usuario/activar",
  verificarToken,
  permitirRoles("Administrador"),
  usuariosControlador.activar
);

// Eliminar usuario definitivamente (solo Admin)
router.delete(
  "/:id_usuario/eliminar",
  verificarToken,
  permitirRoles("Administrador"),
  usuariosControlador.eliminar
);

module.exports = router;


