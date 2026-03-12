const express = require("express");
const router = express.Router();

const productosControlador = require("../modulos/productos/productos.controlador");
const { verificarToken } = require("../middlewares/autenticacion.middleware");
const { permitirRoles } = require("../middlewares/roles.middleware");
const { validarImagenSubida, validarDatosImagen } = require("../middlewares/imagen.middleware");

// Listar: Admin, Operador, Supervisor
router.get(
  "/",
  verificarToken,
  permitirRoles("Administrador", "Operador", "Supervisor"),
  productosControlador.listar
);

// Crear: Admin, Operador
// Validación de imagen: Solo Admin y Supervisor
router.post(
  "/",
  verificarToken,
  permitirRoles("Administrador", "Operador"),
  validarImagenSubida,
  validarDatosImagen,
  productosControlador.crear
);

// Crear masivo: Admin, Operador
router.post(
  "/masivo",
  verificarToken,
  permitirRoles("Administrador", "Operador"),
  productosControlador.crearMasivo
);

// Actualizar: Admin, Operador
// Validación de imagen: Solo Admin y Supervisor
router.put(
  "/:id_producto",
  verificarToken,
  permitirRoles("Administrador", "Operador"),
  validarImagenSubida,
  validarDatosImagen,
  productosControlador.actualizar
);

// Desactivar: SOLO Admin
router.delete(
  "/:id_producto",
  verificarToken,
  permitirRoles("Administrador"),
  productosControlador.desactivar
);
// Activar: Admin, Operador
router.patch(
  "/:id_producto/activar",
  verificarToken,
  permitirRoles("Administrador", "Operador"),
  productosControlador.activar
);
// Eliminar Definitivo: SOLO Admin
router.delete(
  "/:id_producto/definitivo",
  verificarToken,
  permitirRoles("Administrador"),
  productosControlador.eliminarDefinitivo
);

// Obtener proveedores de un producto
router.get(
  "/:id_producto/proveedores",
  verificarToken,
  permitirRoles("Administrador", "Operador", "Supervisor"),
  productosControlador.obtenerProveedores
);

module.exports = router;
