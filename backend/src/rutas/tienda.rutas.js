const express = require("express");
const router = express.Router();
const tiendaControlador = require("../modulos/tienda/tienda.controlador");
const { verificarToken } = require("../middlewares/autenticacion.middleware");
const { permitirRoles } = require("../middlewares/roles.middleware");

// Todas las rutas de tienda son PÚBLICAS (sin verificarToken)

// Listar productos activos con filtros y paginación
router.get("/productos", tiendaControlador.obtenerProductos);

// Detalle de un producto
router.get("/productos/:id", tiendaControlador.obtenerProducto);

// Listar categorías con conteo de productos
router.get("/categorias", tiendaControlador.obtenerCategorias);

// Productos destacados / nuevos
router.get("/destacados", tiendaControlador.obtenerDestacados);

// Obtener Configuración de Tienda
router.get("/configuracion", tiendaControlador.obtenerConfiguracion);

// Actualizar Configuración de Tienda (Solo Administrador)
router.put(
    "/configuracion",
    verificarToken,
    permitirRoles("Administrador"),
    tiendaControlador.actualizarConfiguracion
);

module.exports = router;
