const repo = require("./clientes.repositorio");

async function obtenerClientes() {
  const clientes = await repo.listarClientes();
  return { ok: true, clientes };
}

async function registrarCliente(datos) {
  if (!datos.nombre) {
    return { ok: false, mensaje: "Nombre obligatorio" };
  }
  const cliente = await repo.crearCliente(datos);
  return { ok: true, cliente };
}
async function editarCliente({ id_cliente, nombre, telefono, correo, cedula, direccion }) {
  if (!nombre) {
    return { ok: false, mensaje: "Nombre obligatorio" };
  }

  const cliente = await repo.editarCliente({
    id_cliente,
    nombre,
    telefono,
    correo,
    cedula,
    direccion,
  });

  if (!cliente) {
    return { ok: false, mensaje: "Cliente no encontrado" };
  }

  return { ok: true, mensaje: "Cliente actualizado", cliente };
}

async function cambiarEstadoCliente(id_cliente, activo) {
  const cliente = await repo.cambiarEstadoCliente(id_cliente, activo);

  if (!cliente) {
    return { ok: false, mensaje: "Cliente no encontrado" };
  }

  return {
    ok: true,
    mensaje: activo ? "Cliente activado" : "Cliente desactivado",
    cliente,
  };
}

async function obtenerComprasCliente(id_cliente) {
  const compras = await repo.obtenerComprasCliente(id_cliente);
  return { ok: true, compras };
}

module.exports = {
  obtenerClientes,
  registrarCliente,
  editarCliente,
  cambiarEstadoCliente,
  obtenerComprasCliente,
};
