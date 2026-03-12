const servicio = require("./clientes.servicio");

async function listar(req, res) {
  const resultado = await servicio.obtenerClientes();
  res.json(resultado);
}

async function crear(req, res) {
  const resultado = await servicio.registrarCliente(req.body);
  if (!resultado.ok) {
    return res.status(400).json(resultado);
  }
  res.status(201).json(resultado);
}
async function editar(req, res) {
  const id_cliente = Number(req.params.id_cliente);
  const { nombre, telefono, correo, cedula, direccion } = req.body;

  if (!id_cliente) {
    return res.status(400).json({ mensaje: "ID inválido" });
  }

  const resultado = await servicio.editarCliente({
    id_cliente,
    nombre,
    telefono,
    correo,
    cedula,
    direccion,
  });

  if (!resultado.ok) {
    return res.status(404).json(resultado);
  }

  res.json(resultado);
}

async function desactivar(req, res) {
  const id_cliente = Number(req.params.id_cliente);

  const resultado = await servicio.cambiarEstadoCliente(id_cliente, false);
  if (!resultado.ok) {
    return res.status(404).json(resultado);
  }

  res.json(resultado);
}

async function activar(req, res) {
  const id_cliente = Number(req.params.id_cliente);

  const resultado = await servicio.cambiarEstadoCliente(id_cliente, true);
  if (!resultado.ok) {
    return res.status(404).json(resultado);
  }

  res.json(resultado);
}

async function obtenerCompras(req, res) {
  const id_cliente = Number(req.params.id_cliente);

  if (!id_cliente) {
    return res.status(400).json({ mensaje: "ID inválido" });
  }

  const resultado = await servicio.obtenerComprasCliente(id_cliente);
  res.json(resultado);
}

module.exports = {
  listar,
  crear,
  editar,
  desactivar,
  activar,
  obtenerCompras,
};
