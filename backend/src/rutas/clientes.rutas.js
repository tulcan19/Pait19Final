const express = require("express");
const router = express.Router();
const ctrl = require("../modulos/clientes/clientes.controlador");
const { verificarToken } = require("../middlewares/autenticacion.middleware");
const { permitirRoles } = require("../middlewares/roles.middleware");

router.get(
  "/",
  verificarToken,
  permitirRoles("Administrador", "Operador", "Supervisor"),
  ctrl.listar
);

router.post(
  "/",
  verificarToken,
  permitirRoles("Administrador", "Operador"),
  ctrl.crear
);
router.patch(
  "/:id_cliente",
  verificarToken,
  permitirRoles("Administrador", "Operador"),
  ctrl.editar
);

router.patch(
  "/:id_cliente/desactivar",
  verificarToken,
  permitirRoles("Administrador", "Operador"),
  ctrl.desactivar
);

router.patch(
  "/:id_cliente/activar",
  verificarToken,
  permitirRoles("Administrador", "Operador"),
  ctrl.activar
);

router.get(
  "/:id_cliente/compras",
  verificarToken,
  permitirRoles("Administrador", "Operador", "Supervisor"),
  ctrl.obtenerCompras
);

module.exports = router;
