const servicio = require("./proveedores.servicio");
const { asyncHandler } = require("../../utils/manejoErrores");
const { ErrorNoEncontrado, ErrorValidacion } = require("../../utils/manejoErrores");
const { validarProveedor, sanitizarString } = require("../../utils/validaciones");
const { registrarAuditoria } = require("../../utils/auditoria");

const listar = asyncHandler(async (req, res) => {
  const resultado = await servicio.obtenerProveedores();
  return res.json(resultado);
});

const crear = asyncHandler(async (req, res) => {
  const { nombre, telefono, correo, producto, latitud, longitud } = req.body;

  // Validar y sanitizar datos
  const datosSanitizados = {
    nombre: sanitizarString(nombre),
    telefono: telefono ? sanitizarString(telefono) : undefined,
    correo: correo ? sanitizarString(correo) : undefined,
    producto: producto ? sanitizarString(producto) : undefined,
    // Convertir coordenadas: si son null, undefined o string vacÃ­o, usar null; si son nÃºmeros, validarlos
    latitud: (latitud !== undefined && latitud !== null && latitud !== '') ? Number(latitud) : null,
    longitud: (longitud !== undefined && longitud !== null && longitud !== '') ? Number(longitud) : null,
  };

  validarProveedor(datosSanitizados);

  const resultado = await servicio.registrarProveedor(datosSanitizados);

  if (!resultado.ok) {
    throw new ErrorValidacion(resultado.mensaje);
  }

  // Registrar auditoría
  if (req.usuario) {
    await registrarAuditoria(
      req.usuario.id_usuario,
      "CREAR_PROVEEDOR",
      "PROVEEDORES",
      { proveedor_id: resultado.proveedor?.id_proveedor, nombre: datosSanitizados.nombre }
    );
  }

  return res.status(201).json(resultado);
});

const editar = asyncHandler(async (req, res) => {
  const id_proveedor = Number(req.params.id_proveedor);

  if (!id_proveedor || isNaN(id_proveedor) || id_proveedor < 1) {
    throw new ErrorValidacion("ID de proveedor inválido");
  }

  const { nombre, telefono, correo, producto, latitud, longitud } = req.body;

  // Validar y sanitizar datos
  const datosSanitizados = {
    nombre: nombre ? sanitizarString(nombre) : undefined,
    telefono: telefono ? sanitizarString(telefono) : undefined,
    correo: correo ? sanitizarString(correo) : undefined,
    producto: producto ? sanitizarString(producto) : undefined,
    // Convertir coordenadas: si son null, undefined o string vacÃ­o, usar null; si son nÃºmeros, validarlos
    latitud: (latitud !== undefined && latitud !== null && latitud !== '') ? Number(latitud) : null,
    longitud: (longitud !== undefined && longitud !== null && longitud !== '') ? Number(longitud) : null,
  };

  if (nombre) {
    validarProveedor(datosSanitizados);
  }

  const resultado = await servicio.editarProveedor(id_proveedor, datosSanitizados);

  if (!resultado.ok) {
    throw new ErrorNoEncontrado(resultado.mensaje);
  }

  // Registrar auditoría
  if (req.usuario) {
    await registrarAuditoria(
      req.usuario.id_usuario,
      "EDITAR_PROVEEDOR",
      "PROVEEDORES",
      { proveedor_id: id_proveedor }
    );
  }

  return res.json(resultado);
});

const desactivar = asyncHandler(async (req, res) => {
  const id_proveedor = Number(req.params.id_proveedor);

  if (!id_proveedor || isNaN(id_proveedor) || id_proveedor < 1) {
    throw new ErrorValidacion("ID de proveedor inválido");
  }

  const resultado = await servicio.cambiarEstadoProveedor(id_proveedor, false);

  if (!resultado.ok) {
    throw new ErrorNoEncontrado(resultado.mensaje);
  }

  // Registrar auditoría
  if (req.usuario) {
    await registrarAuditoria(
      req.usuario.id_usuario,
      "DESACTIVAR_PROVEEDOR",
      "PROVEEDORES",
      { proveedor_id: id_proveedor }
    );
  }

  return res.json(resultado);
});

const activar = asyncHandler(async (req, res) => {
  const id_proveedor = Number(req.params.id_proveedor);

  if (!id_proveedor || isNaN(id_proveedor) || id_proveedor < 1) {
    throw new ErrorValidacion("ID de proveedor inválido");
  }

  const resultado = await servicio.cambiarEstadoProveedor(id_proveedor, true);

  if (!resultado.ok) {
    throw new ErrorNoEncontrado(resultado.mensaje);
  }

  // Registrar auditoría
  if (req.usuario) {
    await registrarAuditoria(
      req.usuario.id_usuario,
      "ACTIVAR_PROVEEDOR",
      "PROVEEDORES",
      { proveedor_id: id_proveedor }
    );
  }

  return res.json(resultado);
});

const eliminarPermanente = asyncHandler(async (req, res) => {
  const id_proveedor = Number(req.params.id_proveedor);

  if (!id_proveedor || isNaN(id_proveedor) || id_proveedor < 1) {
    throw new ErrorValidacion("ID de proveedor inválido");
  }

  const resultado = await servicio.eliminarProveedorPermanentemente(id_proveedor);

  if (!resultado.ok) {
    throw new ErrorNoEncontrado(resultado.mensaje);
  }

  // Registrar auditoría
  if (req.usuario) {
    await registrarAuditoria(
      req.usuario.id_usuario,
      "ELIMINAR_PROVEEDOR",
      "PROVEEDORES",
      { proveedor_id: id_proveedor }
    );
  }

  return res.json(resultado);
});

const obtenerProductos = asyncHandler(async (req, res) => {
  const id_proveedor = Number(req.params.id_proveedor);

  if (!id_proveedor || isNaN(id_proveedor) || id_proveedor < 1) {
    throw new ErrorValidacion("ID de proveedor inválido");
  }

  const resultado = await servicio.obtenerProductosDelProveedor(id_proveedor);
  return res.json(resultado);
});

module.exports = {
  listar,
  crear,
  editar,
  desactivar,
  activar,
  eliminarPermanente,
  obtenerProductos,
};



