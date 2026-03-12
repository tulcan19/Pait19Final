const productosServicio = require("./productos.servicio");

async function crear(req, res) {
  try {
    const { nombre, descripcion, precio, stock, stock_minimo, id_categoria, id_proveedor, imagen } = req.body;

    if (!nombre || precio == null || stock == null || !id_categoria) {
      return res.status(400).json({ mensaje: "Faltan datos obligatorios" });
    }

    const resultado = await productosServicio.registrarProducto({
      nombre,
      descripcion,
      precio,
      stock,
      stock_minimo,
      id_categoria,
      id_proveedor,
      imagen,
    });

    return res.status(201).json({ mensaje: "✅ Producto creado", ...resultado });
  } catch (error) {
    console.error("Error crear producto:", error);
    return res.status(500).json({ mensaje: "Error interno del servidor" });
  }
}

async function listar(req, res) {
  try {
    const resultado = await productosServicio.obtenerProductos();
    return res.json(resultado);
  } catch (error) {
    console.error("Error listar productos:", error);
    return res.status(500).json({ mensaje: "Error interno del servidor" });
  }
}

async function actualizar(req, res) {
  try {
    const id_producto = Number(req.params.id_producto);
    const { nombre, descripcion, precio, stock, stock_minimo, id_categoria, id_proveedor, imagen } = req.body;

    if (!id_producto) return res.status(400).json({ mensaje: "ID inválido" });

    const resultado = await productosServicio.editarProducto(id_producto, {
      nombre,
      descripcion,
      precio,
      stock,
      stock_minimo,
      id_categoria,
      id_proveedor,
      imagen,
    });

    if (!resultado.ok) return res.status(404).json({ mensaje: resultado.mensaje });

    return res.json({ mensaje: "✅ Producto actualizado", ...resultado });
  } catch (error) {
    console.error("Error actualizar producto:", error);
    return res.status(500).json({ mensaje: "Error interno del servidor" });
  }
}

async function desactivar(req, res) {
  try {
    const id_producto = Number(req.params.id_producto);
    if (!id_producto) return res.status(400).json({ mensaje: "ID inválido" });

    const resultado = await productosServicio.eliminarLogicoProducto(id_producto);
    if (!resultado.ok) return res.status(404).json({ mensaje: resultado.mensaje });

    return res.json({ mensaje: "✅ Producto desactivado", ...resultado });
  } catch (error) {
    console.error("Error desactivar producto:", error);
    return res.status(500).json({ mensaje: "Error interno del servidor" });
  }
}

async function activar(req, res) {
  try {
    const id_producto = Number(req.params.id_producto);
    if (!id_producto) return res.status(400).json({ mensaje: "ID inválido" });

    // ✅ Llamar al servicio correcto
    const resultado = await productosServicio.activarProducto(id_producto);

    if (!resultado.ok) return res.status(404).json({ mensaje: resultado.mensaje });

    return res.status(200).json({ mensaje: "✅ Producto activado", ...resultado });
  } catch (error) {
    console.error("Error activar producto:", error);
    return res.status(500).json({ mensaje: "Error interno del servidor" });
  }
}



async function obtenerProveedores(req, res) {
  try {
    const id_producto = Number(req.params.id_producto);
    if (!id_producto) return res.status(400).json({ mensaje: "ID inválido" });

    const resultado = await productosServicio.obtenerProveedoresDelProducto(id_producto);
    return res.json(resultado);
  } catch (error) {
    console.error("Error obtener proveedores del producto:", error);
    return res.status(500).json({ mensaje: "Error interno del servidor" });
  }
}

async function eliminarDefinitivo(req, res) {
  try {
    const id_producto = Number(req.params.id_producto);
    if (!id_producto) return res.status(400).json({ mensaje: "ID inválido" });

    const resultado = await productosServicio.eliminarFisicoProducto(id_producto);
    if (!resultado.ok) return res.status(404).json({ mensaje: resultado.mensaje });

    return res.json({ mensaje: "✅ Producto eliminado definitivamente", ...resultado });
  } catch (error) {
    console.error("Error eliminar definitivo producto:", error);
    if (error.code === '23503') {
      return res.status(400).json({ mensaje: "No se puede eliminar el producto porque tiene registros asociados (ventas o compras)." });
    }
    return res.status(500).json({ mensaje: "Error interno del servidor" });
  }
}

async function crearMasivo(req, res) {
  try {
    const productos = req.body;

    const resultado = await productosServicio.registrarProductosMasivos(productos);

    if (!resultado.ok) {
      return res.status(400).json(resultado);
    }

    return res.status(201).json(resultado);
  } catch (error) {
    console.error("Error crear productos masivo:", error);
    return res.status(500).json({ mensaje: "Error interno del servidor", error: error.message });
  }
}

module.exports = {
  crear,
  listar,
  actualizar,
  desactivar,
  activar,
  obtenerProveedores,
  eliminarDefinitivo,
  crearMasivo,
};
