const pool = require("../../config/base_datos");

async function obtenerLotesDisponiblesForUpdate(productoId, sucursalId, executor) {
  const consulta = `
    SELECT sl.*, p.abv, p.consume_early, c.nombre AS categoria_nombre
    FROM stock_lotes sl
    INNER JOIN productos p ON p.id_producto = sl.producto_id
    LEFT JOIN categorias c ON c.id_categoria = p.id_categoria
    WHERE sl.producto_id = $1
      AND ($2::int IS NULL OR sl.sucursal_id = $2)
      AND sl.cantidad_disponible > 0
      AND (sl.fecha_caducidad IS NULL OR sl.fecha_caducidad >= now()::date)
    ORDER BY
      CASE WHEN c.nombre ILIKE 'cerveza' OR c.nombre ILIKE 'crema' OR (c.nombre ILIKE 'vino' AND p.consume_early) THEN 0 ELSE 1 END ASC,
      CASE WHEN c.nombre ILIKE 'cerveza' OR c.nombre ILIKE 'crema' OR (c.nombre ILIKE 'vino' AND p.consume_early) THEN COALESCE(sl.fecha_caducidad, 'infinity') ELSE NULL END ASC NULLS LAST,
      CASE WHEN c.nombre ILIKE 'destilado' THEN (CASE WHEN sl.abierto THEN 0 ELSE 1 END) ELSE NULL END ASC NULLS LAST,
      sl.fecha_ingreso ASC,
      p.abv ASC
    FOR UPDATE OF sl SKIP LOCKED
  `;
  const exec = executor || pool;
  const { rows } = await exec.query(consulta, [productoId, sucursalId]);
  return rows;
}

async function obtenerLotesPorProducto(productoId) {
  const consulta = `
    SELECT * FROM stock_lotes 
    WHERE producto_id = $1 AND cantidad_disponible > 0
    ORDER BY fecha_caducidad ASC NULLS LAST, fecha_ingreso ASC
  `;
  const { rows } = await pool.query(consulta, [productoId]);
  return rows;
}

async function reducirCantidadLote(id_lote, cantidad, client) {
  const sql = `
    UPDATE stock_lotes
    SET cantidad_disponible = cantidad_disponible - $1,
        cantidad_total = GREATEST(cantidad_total - $1, 0),
        updated_at = now()
    WHERE id_lote = $2
    RETURNING *
  `;
  const executor = client || pool;
  const { rows } = await executor.query(sql, [cantidad, id_lote]);
  return rows[0];
}

async function crearLote(lote) {
  const sql = `
    INSERT INTO stock_lotes (producto_id, lote, cantidad_total, cantidad_disponible, fecha_caducidad, fecha_ingreso, sucursal_id, metadata)
    VALUES ($1,$2,$3,$3,$4,$5,$6,$7)
    RETURNING *
  `;
  const valores = [
    lote.producto_id,
    lote.lote || null,
    lote.cantidad || 0,
    lote.fecha_caducidad || null,
    lote.fecha_ingreso || new Date(),
    lote.sucursal_id || null,
    lote.metadata || null,
  ];
  const { rows } = await pool.query(sql, valores);
  return rows[0];
}

module.exports = {
  obtenerLotesDisponiblesForUpdate,
  obtenerLotesPorProducto,
  reducirCantidadLote,
  crearLote,
};
