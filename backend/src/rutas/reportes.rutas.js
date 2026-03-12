const express = require("express");
const router = express.Router();

const ctrl = require("../modulos/reportes/reportes.controlador");
const { verificarToken } = require("../middlewares/autenticacion.middleware");
const { permitirRoles } = require("../middlewares/roles.middleware");

// PDF de venta
router.get(
  "/ventas/:id_venta/pdf",
  verificarToken,
  permitirRoles("Administrador", "Operador", "Supervisor"),
  ctrl.ventaPdf
);

// PDF de movimientos (kardex)
router.get(
  "/movimientos/pdf",
  verificarToken,
  permitirRoles("Administrador", "Operador", "Supervisor"),
  ctrl.movimientosPdf
);

module.exports = router;
