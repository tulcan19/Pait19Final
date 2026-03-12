const repo = require("./ventas.repositorio");
const clientesRepo = require("../clientes/clientes.repositorio");

async function registrarVenta({ id_cliente, metodo_pago, detalles, id_usuario }) {
  if (!Array.isArray(detalles) || detalles.length === 0) {
    return { ok: false, mensaje: "La venta debe tener al menos un producto" };
  }

  let idClienteFinal = id_cliente ? Number(id_cliente) : null;
  if (!idClienteFinal || idClienteFinal === 0) {
    const idConsumidor = await clientesRepo.obtenerConsumidorFinal();
    if (!idConsumidor) {
      return { ok: false, mensaje: "No existe cliente 'Consumidor Final'. Ejecuta la migración 001_sierrastock.sql" };
    }
    idClienteFinal = idConsumidor;
  }

  const client = await repo.pool.connect();

  try {
    await client.query("BEGIN");

    // Calcular total
    let total = 0;
    for (const d of detalles) {
      const subtotal = Number(d.cantidad) * Number(d.precio);
      total += subtotal;
    }

    // Crear venta (cabecera)
    const venta = await repo.crearVenta(client, {
      id_cliente: idClienteFinal,
      total,
      id_usuario,
      metodo_pago: metodo_pago || "efectivo",
    });

    // Procesar detalle + stock + movimiento
    for (const d of detalles) {
      const id_producto = Number(d.id_producto);
      const cantidad = Number(d.cantidad);
      const precio = Number(d.precio);

      if (!id_producto || cantidad <= 0 || precio <= 0) {
        throw new Error("Detalle inválido en la venta");
      }

      const producto = await repo.obtenerProducto(client, id_producto);

      if (!producto) throw new Error(`Producto no encontrado: ${id_producto}`);
      if (!producto.activo) throw new Error("Producto inactivo");

      const stock_anterior = Number(producto.stock);
      if (cantidad > stock_anterior) throw new Error("Stock insuficiente");

      const stock_actual = stock_anterior - cantidad;
      const subtotal = cantidad * precio;

      await repo.insertarDetalle(client, {
        id_venta: venta.id_venta,
        id_producto,
        cantidad,
        precio,
        subtotal,
      });

      await repo.actualizarStock(client, id_producto, stock_actual);

      await repo.registrarMovimiento(client, {
        id_producto,
        tipo: "salida",
        cantidad,
        stock_anterior,
        stock_actual,
        id_usuario,
      });
    }

    await client.query("COMMIT");
    return { ok: true, venta, total };
  } catch (error) {
    await client.query("ROLLBACK");
    return { ok: false, mensaje: error.message };
  } finally {
    client.release();
  }
}

async function listarVentas() {
  const ventas = await repo.listarVentas();
  return { ok: true, ventas };
}

async function detalleVenta(id_venta) {
  const data = await repo.detalleVenta(id_venta);
  if (!data.cabecera) return { ok: false, mensaje: "Venta no encontrada" };
  return { ok: true, ...data };
}

async function anularVenta({ id_venta, motivo, id_usuario }) {
  const data = await repo.detalleVenta(id_venta);
  if (!data.cabecera) return { ok: false, mensaje: "Venta no encontrada" };
  if (data.cabecera.estado === "anulada") return { ok: false, mensaje: "La venta ya está anulada" };

  const client = await repo.pool.connect();
  try {
    await client.query("BEGIN");

    for (const d of data.detalle) {
      const producto = await repo.obtenerProducto(client, d.id_producto);
      if (!producto) throw new Error(`Producto no encontrado: ${d.id_producto}`);
      const stock_anterior = Number(producto.stock);
      const cantidad = Number(d.cantidad);
      const stock_actual = stock_anterior + cantidad;

      await repo.actualizarStock(client, d.id_producto, stock_actual);
      await repo.registrarMovimiento(client, {
        id_producto: d.id_producto,
        tipo: "entrada",
        cantidad,
        stock_anterior,
        stock_actual,
        id_usuario,
      });
    }

    await repo.actualizarEstadoVenta(client, id_venta, "anulada");
    await client.query("COMMIT");
    return { ok: true, mensaje: "Venta anulada. Stock revertido." };
  } catch (error) {
    await client.query("ROLLBACK");
    return { ok: false, mensaje: error.message };
  } finally {
    client.release();
  }
}

async function restaurarVenta({ id_venta, id_usuario }) {
  const data = await repo.detalleVenta(id_venta);
  if (!data.cabecera) return { ok: false, mensaje: "Venta no encontrada" };
  if (data.cabecera.estado !== "anulada") return { ok: false, mensaje: "Solo se pueden restaurar ventas anuladas" };

  const client = await repo.pool.connect();
  try {
    await client.query("BEGIN");

    // Verificar stock disponible antes de aplicar la restauración
    for (const d of data.detalle) {
      const producto = await repo.obtenerProducto(client, d.id_producto);
      if (!producto) throw new Error(`Producto no encontrado: ${d.id_producto}`);
      const stock_actual = Number(producto.stock);
      const cantidad = Number(d.cantidad);
      if (stock_actual < cantidad) {
        throw new Error(`Stock insuficiente para producto ${producto.nombre} (id ${d.id_producto}). Disponible: ${stock_actual}, requerido: ${cantidad}`);
      }
    }

    // Aplicar decremento de stock y registrar movimientos (salida)
    for (const d of data.detalle) {
      const producto = await repo.obtenerProducto(client, d.id_producto);
      const stock_anterior = Number(producto.stock);
      const cantidad = Number(d.cantidad);
      const stock_nuevo = stock_anterior - cantidad;

      await repo.actualizarStock(client, d.id_producto, stock_nuevo);
      await repo.registrarMovimiento(client, {
        id_producto: d.id_producto,
        tipo: "salida",
        cantidad,
        stock_anterior,
        stock_actual: stock_nuevo,
        id_usuario,
      });
    }

    await repo.actualizarEstadoVenta(client, id_venta, "registrada");
    await client.query("COMMIT");
    return { ok: true, mensaje: "Venta restaurada y stock ajustado." };
  } catch (error) {
    await client.query("ROLLBACK");
    return { ok: false, mensaje: error.message };
  } finally {
    client.release();
  }
}

module.exports = {
  registrarVenta,
  listarVentas,
  detalleVenta,
  anularVenta,
  restaurarVenta,
};
