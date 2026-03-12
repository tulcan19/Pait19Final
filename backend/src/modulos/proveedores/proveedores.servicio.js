const repo = require("./proveedores.repositorio");

async function obtenerProveedores() {
  const proveedores = await repo.listarProveedores();
  return { ok: true, proveedores };
}

async function registrarProveedor(datos) {
  if (!datos.nombre) {
    return { ok: false, mensaje: "Nombre obligatorio" };
  }
  const proveedor = await repo.crearProveedor(datos);
  return { ok: true, proveedor };
}

async function editarProveedor(id_proveedor, { nombre, telefono, correo, producto, latitud, longitud }) {
  if (!nombre) {
    return { ok: false, mensaje: "Nombre obligatorio" };
  }

  const proveedor = await repo.editarProveedor(id_proveedor, {
    nombre,
    telefono,
    correo,
    producto,
    latitud,
    longitud,
  });

  if (!proveedor) {
    return { ok: false, mensaje: "Proveedor no encontrado" };
  }

  return { ok: true, mensaje: "Proveedor actualizado", proveedor };
}

async function cambiarEstadoProveedor(id_proveedor, activo) {
  const proveedor = await repo.cambiarEstadoProveedor(id_proveedor, activo);

  if (!proveedor) {
    return { ok: false, mensaje: "Proveedor no encontrado" };
  }

  return {
    ok: true,
    mensaje: activo ? "Proveedor activado" : "Proveedor desactivado",
    proveedor,
  };
}

async function eliminarProveedorPermanentemente(id_proveedor) {
  const proveedor = await repo.eliminarProveedorPermanentemente(id_proveedor);

  if (!proveedor) {
    return { ok: false, mensaje: "Proveedor no encontrado" };
  }

  return { ok: true, mensaje: "Proveedor eliminado permanentemente" };
}

async function obtenerProductosDelProveedor(id_proveedor) {
  const productos = await repo.obtenerProductosDelProveedor(id_proveedor);
  return { ok: true, productos };
}

module.exports = {
  obtenerProveedores,
  registrarProveedor,
  editarProveedor,
  cambiarEstadoProveedor,
  eliminarProveedorPermanentemente,
  obtenerProductosDelProveedor,
};
