const express = require("express");
const router = express.Router();

const inventarioControlador = require("../modulos/inventario/inventario.controlador");
const stockControlador = require("../modulos/stock/stock.controlador");
const stockCompositeControlador = require("../modulos/stock/stock.composite.controlador");
const { verificarToken } = require("../middlewares/autenticacion.middleware");
const { permitirRoles } = require("../middlewares/roles.middleware");

// Listar movimientos: Admin, Operador, Supervisor
router.get(
  "/movimientos",
  verificarToken,
  permitirRoles("Administrador", "Operador", "Supervisor"),
  inventarioControlador.listar
);

// Registrar movimiento: Admin, Operador
router.post(
  "/movimientos",
  verificarToken,
  permitirRoles("Administrador", "Operador"),
  inventarioControlador.registrar
);

// Asignación automática de lotes (FEFO avanzado) - Solo Operador
router.post(
  "/asignar-lotes",
  verificarToken,
  permitirRoles("Operador"),
  stockControlador.asignarLotes
);

// Endpoint compuesto: Asignar lotes (FEFO) y registrar movimientos de salida (ATÓMICO)
// Disponible solo para Operador
router.post(
  "/asignar-y-registrar",
  verificarToken,
  permitirRoles("Operador"),
  stockCompositeControlador.asignarYRegistrar
);

// Listar lotes de un producto: Admin, Operador, Supervisor
router.get(
  "/lotes/:productoId",
  verificarToken,
  permitirRoles("Administrador", "Operador", "Supervisor"),
  stockControlador.obtenerLotesByProducto
);

module.exports = router;
