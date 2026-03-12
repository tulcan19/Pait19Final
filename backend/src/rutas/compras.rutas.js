const express = require("express");
const router = express.Router();

const ctrl = require("../modulos/compras/compras.controlador");
const { verificarToken } = require("../middlewares/autenticacion.middleware");
const { permitirRoles } = require("../middlewares/roles.middleware");
const { validarImagenSubida, validarDatosImagen } = require("../middlewares/imagen.middleware");

// Listar compras: Admin, Operador, Supervisor
router.get(
  "/",
  verificarToken,
  permitirRoles("Administrador", "Operador", "Supervisor"),
  ctrl.listar
);

// Detalle compra: Admin, Operador, Supervisor
router.get(
  "/:id_compra",
  verificarToken,
  permitirRoles("Administrador", "Operador", "Supervisor"),
  ctrl.detalle
);

// Crear compra: Admin, Operador
// Validación de imagen: Solo Admin y Supervisor
router.post(
  "/",
  verificarToken,
  permitirRoles("Administrador", "Operador"),
  validarImagenSubida,
  validarDatosImagen,
  ctrl.crear
);

module.exports = router;
