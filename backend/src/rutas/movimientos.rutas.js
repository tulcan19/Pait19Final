const express = require("express");
const router = express.Router();

const movimientosControlador = require("../modulos/movimientos/movimientos.controlador");
const { verificarToken } = require("../middlewares/autenticacion.middleware");
const { permitirRoles } = require("../middlewares/roles.middleware");
const { validarImagenSubida, validarDatosImagen } = require("../middlewares/imagen.middleware");

// Listar: Admin, Operador, Supervisor
router.get(
  "/",
  verificarToken,
  permitirRoles("Administrador", "Operador", "Supervisor"),
  movimientosControlador.listar
);

// Crear: Admin, Operador
// Validación de imagen: Solo Admin y Supervisor
router.post(
  "/",
  verificarToken,
  permitirRoles("Administrador", "Operador"),
  validarImagenSubida,
  validarDatosImagen,
  movimientosControlador.crear
);

module.exports = router;
