const express = require("express");
const router = express.Router();
const { verificarToken } = require("../middlewares/autenticacion.middleware");
const { permitirRoles } = require("../middlewares/roles.middleware");
const { asyncHandler } = require("../utils/manejoErrores");
const { exportarCSV, generarNombreArchivo } = require("../utils/exportarDatos");
const pool = require("../config/base_datos");

/**
 * Exportar proveedores a CSV
 */
router.get(
  "/proveedores/csv",
  verificarToken,
  permitirRoles("Administrador", "Supervisor"),
  asyncHandler(async (req, res) => {
    const query = `
      SELECT 
        id_proveedor,
        nombre,
        telefono,
        correo,
        producto,
        activo,
        fecha_creacion
      FROM proveedores
      ORDER BY nombre
    `;

    const resultado = await pool.query(query);
    const datos = resultado.rows;

    const columnas = [
      { campo: 'id_proveedor', titulo: 'ID' },
      { campo: 'nombre', titulo: 'Nombre' },
      { campo: 'telefono', titulo: 'Teléfono' },
      { campo: 'correo', titulo: 'Correo' },
      { campo: 'producto', titulo: 'Producto' },
      { campo: 'activo', titulo: 'Activo' },
      { campo: 'fecha_creacion', titulo: 'Fecha Creación' },
    ];

    const csv = exportarCSV(datos, columnas);
    const nombreArchivo = generarNombreArchivo('proveedores', 'csv');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
    res.send(csv);
  })
);

/**
 * Exportar productos a CSV
 */
router.get(
  "/productos/csv",
  verificarToken,
  permitirRoles("Administrador", "Supervisor"),
  asyncHandler(async (req, res) => {
    const query = `
      SELECT 
        p.id_producto,
        p.nombre,
        p.descripcion,
        p.precio,
        p.stock,
        p.stock_minimo,
        c.nombre as categoria,
        p.activo,
        p.fecha_creacion
      FROM productos p
      LEFT JOIN categorias c ON p.categoria_id = c.id_categoria
      ORDER BY p.nombre
    `;

    const resultado = await pool.query(query);
    const datos = resultado.rows;

    const columnas = [
      { campo: 'id_producto', titulo: 'ID' },
      { campo: 'nombre', titulo: 'Nombre' },
      { campo: 'descripcion', titulo: 'Descripción' },
      { campo: 'precio', titulo: 'Precio' },
      { campo: 'stock', titulo: 'Stock' },
      { campo: 'stock_minimo', titulo: 'Stock Mínimo' },
      { campo: 'categoria', titulo: 'Categoría' },
      { campo: 'activo', titulo: 'Activo' },
      { campo: 'fecha_creacion', titulo: 'Fecha Creación' },
    ];

    const csv = exportarCSV(datos, columnas);
    const nombreArchivo = generarNombreArchivo('productos', 'csv');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
    res.send(csv);
  })
);

module.exports = router;
