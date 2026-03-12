const repo = require("./compras.repositorio");

async function registrarCompra({ id_proveedor, detalles, id_usuario }) {
  if (!Array.isArray(detalles) || detalles.length === 0) {
    return { ok: false, mensaje: "La compra debe tener al menos un producto" };
  }

  const client = await repo.pool.connect();

  try {
    await client.query("BEGIN");

    // total
    let total = 0;
    for (const d of detalles) {
      const subtotal = Number(d.cantidad) * Number(d.costo);
      total += subtotal;
    }

    // cabecera
    const compra = await repo.crearCompra(client, { id_proveedor, total, id_usuario });

    // detalle + stock + movimiento (ENTRADA)
    for (const d of detalles) {
      const id_producto = Number(d.id_producto);
      const cantidad = Number(d.cantidad);
      const costo = Number(d.costo);

      // ✅ AQUÍ ESTABA EL ERROR: precio -> costo
      if (!id_producto || cantidad <= 0 || costo <= 0) {
        throw new Error("Detalle inválido en la compra");
      }

      const producto = await repo.obtenerProducto(client, id_producto);
      if (!producto) throw new Error(`Producto no encontrado: ${id_producto}`);
      if (!producto.activo) throw new Error("Producto inactivo");

      const stock_anterior = Number(producto.stock);
      const stock_actual = stock_anterior + cantidad;
      const subtotal = cantidad * costo;

      await repo.insertarDetalle(client, {
        id_compra: compra.id_compra,
        id_producto,
        cantidad,
        costo,
        subtotal,
      });

      await repo.actualizarStock(client, id_producto, stock_actual);

      await repo.registrarMovimiento(client, {
        id_producto,
        tipo: "entrada",
        cantidad,
        stock_anterior,
        stock_actual,
        id_usuario,
      });
    }

    await client.query("COMMIT");
    return { ok: true, compra, total };
  } catch (error) {
    await client.query("ROLLBACK");
    return { ok: false, mensaje: error.message };
  } finally {
    client.release();
  }
}

async function listarCompras() {
  const compras = await repo.listarCompras();
  return { ok: true, compras };
}

async function detalleCompra(id_compra) {
  const data = await repo.detalleCompra(id_compra);
  if (!data.cabecera) return { ok: false, mensaje: "Compra no encontrada" };
  return { ok: true, ...data };
}

module.exports = {
  registrarCompra,
  listarCompras,
  detalleCompra,
};
