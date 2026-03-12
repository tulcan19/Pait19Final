const express = require("express");
const router = express.Router();

const categoriasControlador = require("../modulos/categorias/categorias.controlador");
const { verificarToken } = require("../middlewares/autenticacion.middleware");
const { permitirRoles } = require("../middlewares/roles.middleware");

const subcategoriasControlador = require("../modulos/categorias/subcategorias.controlador");

// Listar: Admin, Operador, Supervisor
router.get(
  "/",
  verificarToken,
  permitirRoles("Administrador", "Operador", "Supervisor"),
  categoriasControlador.listar
);

// --- Subcategorías ---
router.post(
  "/subcategorias",
  verificarToken,
  permitirRoles("Administrador", "Operador"),
  subcategoriasControlador.crear
);

router.get(
  "/:id_categoria/subcategorias",
  verificarToken,
  permitirRoles("Administrador", "Operador", "Supervisor"),
  subcategoriasControlador.listarPorCategoria
);

router.put(
  "/subcategorias/:id",
  verificarToken,
  permitirRoles("Administrador", "Operador"),
  subcategoriasControlador.actualizar
);

router.delete(
  "/subcategorias/:id",
  verificarToken,
  permitirRoles("Administrador", "Operador"),
  subcategoriasControlador.eliminar
);

// Crear: Admin, Operador
router.post(
  "/",
  verificarToken,
  permitirRoles("Administrador", "Operador"),
  categoriasControlador.crear
);

// Actualizar: Admin, Operador
router.put(
  "/:id_categoria",
  verificarToken,
  permitirRoles("Administrador", "Operador"),
  categoriasControlador.actualizar
);

module.exports = router;
