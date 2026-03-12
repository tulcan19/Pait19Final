const express = require("express");
const router = express.Router();

const dashboardControlador = require("../modulos/dashboard/dashboard.controlador");
const { verificarToken } = require("../middlewares/autenticacion.middleware");
const { permitirRoles } = require("../middlewares/roles.middleware");

// Ver dashboard: Admin, Operador, Supervisor
router.get(
  "/",
  verificarToken,
  permitirRoles("Administrador", "Operador", "Supervisor"),
  dashboardControlador.ver
);

module.exports = router;
