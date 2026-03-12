const pool = require("../../config/base_datos");
const stockRepositorio = require("./stock.repositorio");

async function asignarLotes(productoId, sucursalId, cantidadSolicitada) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const lotes = await stockRepositorio.obtenerLotesDisponiblesForUpdate(productoId, sucursalId, client);

    let remaining = Number(cantidadSolicitada);
    const asignados = [];

    for (const lote of lotes) {
      if (remaining <= 0) break;
      const disponible = Number(lote.cantidad_disponible || 0);
      if (disponible <= 0) continue;
      const take = Math.min(remaining, disponible);
      // reducir usando la conexión de la transacción
      const actualizado = await stockRepositorio.reducirCantidadLote(lote.id_lote, take, client);
      asignados.push({ id_lote: lote.id_lote, lote: lote.lote, cantidad: take, fecha_caducidad: lote.fecha_caducidad, fecha_apertura: lote.fecha_apertura });
      remaining -= take;
    }

    if (remaining > 0) {
      await client.query("ROLLBACK");
      return { ok: false, mensaje: "Stock insuficiente", faltante: remaining };
    }

    await client.query("COMMIT");
    return { ok: true, asignados };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

// Asignar lotes y registrar movimientos (salida) en una sola transacción.
async function asignarYRegistrar(items, id_usuario, sucursalId) {
  // items: [{ id_producto, cantidad }]
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const asignacionesTotales = {};

    for (const it of items) {
      let remaining = Number(it.cantidad);
      const productoId = Number(it.id_producto);

      // obtener lotes bloqueados
      const lotes = await stockRepositorio.obtenerLotesDisponiblesForUpdate(productoId, sucursalId, client);

      const asignados = [];

      for (const lote of lotes) {
        if (remaining <= 0) break;
        const disponible = Number(lote.cantidad_disponible || 0);
        if (disponible <= 0) continue;
        const take = Math.min(remaining, disponible);
        await stockRepositorio.reducirCantidadLote(lote.id_lote, take, client);
        asignados.push({ id_lote: lote.id_lote, lote: lote.lote, cantidad: take, fecha_caducidad: lote.fecha_caducidad, fecha_apertura: lote.fecha_apertura });
        remaining -= take;
      }

      if (remaining > 0) {
        await client.query('ROLLBACK');
        return { ok: false, mensaje: 'Stock insuficiente', id_producto: productoId, faltante: remaining };
      }

      // actualizar stock total en productos
      const upd = await client.query(
        `UPDATE productos SET stock = GREATEST(stock - $1, 0) WHERE id_producto = $2 RETURNING stock`,
        [it.cantidad, productoId]
      );

      if (upd.rows.length === 0) {
        await client.query('ROLLBACK');
        return { ok: false, mensaje: `Producto con ID ${productoId} no encontrado al intentar actualizar stock` };
      }

      const stockActual = Number(upd.rows[0].stock);
      const stockAnterior = stockActual + Number(it.cantidad);

      // registrar movimiento por producto
      await client.query(
        `INSERT INTO movimientos_inventario (id_producto, tipo, cantidad, stock_anterior, stock_actual, id_usuario)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [productoId, 'salida', it.cantidad, stockAnterior, stockActual, id_usuario]
      );

      asignacionesTotales[productoId] = asignados;
    }

    await client.query('COMMIT');
    return { ok: true, asignados: asignacionesTotales };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("CRITICAL ERROR in asignarYRegistrar:", error);
    throw error;
  } finally {
    client.release();
  }
}

async function obtenerResumenLotes(productoId) {
  try {
    const lotes = await stockRepositorio.obtenerLotesPorProducto(productoId);
    return { ok: true, lotes };
  } catch (error) {
    console.error("Error obtenerResumenLotes:", error);
    throw error;
  }
}

module.exports = {
  asignarLotes,
  asignarYRegistrar,
  obtenerResumenLotes,
};
