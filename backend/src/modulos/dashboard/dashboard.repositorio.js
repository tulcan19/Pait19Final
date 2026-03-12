const pool = require("../../config/base_datos");

async function resumenTotales(desde = null) {
  const filtrosFecha = desde ? "AND fecha >= $1" : "";
  const params = desde ? [desde] : [];

  const consulta = `
    SELECT
      (
        SELECT COALESCE(SUM(total), 0)
        FROM ventas
        WHERE estado = 'registrada' ${filtrosFecha}
      ) AS total_ventas,
      (
        SELECT COALESCE(SUM(total), 0)
        FROM compras
        WHERE estado = 'registrada' ${filtrosFecha}
      ) AS total_compras,
      (
        SELECT COALESCE(SUM(monto), 0)
        FROM gastos
      ) AS total_gastos
  `;

  const resultado = await pool.query(consulta, params);
  return resultado.rows[0];
}

async function productosPopulares(limite = 5, desde = null) {
  const filtrosFecha = desde ? "AND v.fecha >= $2" : "";
  const params = desde ? [limite, desde] : [limite];

  const consulta = `
    SELECT p.id_producto, p.nombre, p.imagen,
           COALESCE(SUM(dv.cantidad), 0) AS unidades_vendidas
    FROM productos p
    INNER JOIN detalle_venta dv ON dv.id_producto = p.id_producto
    INNER JOIN ventas v ON v.id_venta = dv.id_venta
    WHERE v.estado = 'registrada' ${filtrosFecha}
    GROUP BY p.id_producto, p.nombre, p.imagen
    ORDER BY unidades_vendidas DESC
    LIMIT $1
  `;

  const resultado = await pool.query(consulta, params);
  return resultado.rows;
}

async function stockBajo(umbral = 5) {
  const consulta = `
    SELECT id_producto, nombre, stock, imagen
    FROM productos
    WHERE activo = TRUE AND stock <= $1
    ORDER BY stock ASC
  `;
  const resultado = await pool.query(consulta, [umbral]);
  return resultado.rows;
}

async function actividadReciente(limite = 10, desde = null) {
  const filtrosFecha = desde ? "WHERE m.fecha >= $2" : "";
  const params = desde ? [limite, desde] : [limite];

  const consulta = `
    SELECT m.id_movimiento, m.tipo, m.cantidad, m.stock_anterior, m.stock_actual, m.fecha,
           p.nombre AS producto, p.imagen, u.nombre AS usuario
    FROM movimientos_inventario m
    INNER JOIN productos p ON p.id_producto = m.id_producto
    INNER JOIN usuarios u ON u.id_usuario = m.id_usuario
    ${filtrosFecha}
    ORDER BY m.fecha DESC
    LIMIT $1
  `;

  const resultado = await pool.query(consulta, params);
  return resultado.rows;
}

async function seriesFinanzas(desde) {
  // Requiere que desde venga definido; si no, el servicio pone un default.
  const consulta = `
    WITH fechas AS (
      SELECT generate_series($1::timestamp, NOW(), '1 day') AS fecha
    ),
    ventas AS (
      SELECT date(fecha) AS fecha, SUM(total) AS total
      FROM ventas
      WHERE estado = 'registrada' AND fecha >= $1
      GROUP BY date(fecha)
    ),
    compras AS (
      SELECT date(fecha) AS fecha, SUM(total) AS total
      FROM compras
      WHERE estado = 'registrada' AND fecha >= $1
      GROUP BY date(fecha)
    ),
    gastos AS (
      SELECT date(fecha) AS fecha, SUM(monto) AS total
      FROM gastos
      WHERE fecha >= $1
      GROUP BY date(fecha)
    )
    SELECT
      to_char(f.fecha, 'YYYY-MM-DD') AS fecha,
      COALESCE(v.total, 0) AS ventas,
      COALESCE(c.total, 0) AS compras,
      COALESCE(g.total, 0) AS gastos
    FROM fechas f
    LEFT JOIN ventas v ON v.fecha = f.fecha
    LEFT JOIN compras c ON c.fecha = f.fecha
    LEFT JOIN gastos g ON g.fecha = f.fecha
    ORDER BY f.fecha ASC
  `;

  const resultado = await pool.query(consulta, [desde]);
  return resultado.rows;
}

module.exports = {
  resumenTotales,
  productosPopulares,
  stockBajo,
  actividadReciente,
  seriesFinanzas,
};
