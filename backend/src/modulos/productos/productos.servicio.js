const productosRepositorio = require("./productos.repositorio");

async function registrarProducto(datos) {
  const producto = await productosRepositorio.crearProducto(datos);
  return { ok: true, producto };
}

async function obtenerProductos() {
  const productos = await productosRepositorio.listarProductos();
  return { ok: true, productos };
}

async function editarProducto(id_producto, datos) {
  const existe = await productosRepositorio.existeProducto(id_producto);
  if (!existe) return { ok: false, mensaje: "Producto no encontrado" };

  const producto = await productosRepositorio.actualizarProducto(id_producto, datos);
  return { ok: true, producto };
}

async function eliminarLogicoProducto(id_producto) {
  const existe = await productosRepositorio.existeProducto(id_producto);
  if (!existe) return { ok: false, mensaje: "Producto no encontrado" };

  const producto = await productosRepositorio.desactivarProducto(id_producto);
  return { ok: true, producto };
}

async function activarProducto(id_producto) {
  const existe = await productosRepositorio.existeProducto(id_producto);
  if (!existe) return { ok: false, mensaje: "Producto no encontrado" };

  const producto = await productosRepositorio.activarProducto(id_producto);
  return { ok: true, producto };
}



async function obtenerProveedoresDelProducto(id_producto) {
  const productosRepositorio = require("./productos.repositorio");
  const proveedores = await productosRepositorio.obtenerProveedoresDeProducto(id_producto);
  return { ok: true, proveedores };
}

async function eliminarFisicoProducto(id_producto) {
  const existe = await productosRepositorio.existeProducto(id_producto);
  if (!existe) return { ok: false, mensaje: "Producto no encontrado" };

  const producto = await productosRepositorio.eliminarProducto(id_producto);
  return { ok: true, producto };
}

async function registrarProductosMasivos(listaProductos) {
  if (!Array.isArray(listaProductos) || listaProductos.length === 0) {
    return { ok: false, mensaje: "Se requiere un array de productos no vacío" };
  }

  // Validación básica por cada producto
  for (const p of listaProductos) {
    if (!p.nombre || p.precio == null || !p.id_categoria) {
      return { ok: false, mensaje: `Datos incompletos en uno o más productos. Falta nombre, precio o categoría.` };
    }
  }

  const productos = await productosRepositorio.crearProductosMasivos(listaProductos);
  return { ok: true, mensaje: `${productos.length} productos registrados con éxito`, productos };
}

module.exports = {
  registrarProducto,
  obtenerProductos,
  editarProducto,
  eliminarLogicoProducto,
  activarProducto,
  obtenerProveedoresDelProducto,
  eliminarFisicoProducto,
  registrarProductosMasivos,
};
