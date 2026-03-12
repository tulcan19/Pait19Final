const categoriasRepositorio = require("./categorias.repositorio");

async function registrarCategoria({ nombre, descripcion, imagen }) {
  const categoria = await categoriasRepositorio.crearCategoria({
    nombre,
    descripcion,
    imagen,
  });
  return { ok: true, categoria };
}

async function editarCategoria(id, { nombre, descripcion, imagen }) {
  const categoria = await categoriasRepositorio.actualizarCategoria(id, {
    nombre,
    descripcion,
    imagen,
  });
  if (!categoria) return { ok: false, mensaje: "Categoría no encontrada" };
  return { ok: true, categoria };
}

async function obtenerCategorias() {
  const categorias = await categoriasRepositorio.listarCategorias();
  return { ok: true, categorias };
}

module.exports = {
  registrarCategoria,
  editarCategoria,
  obtenerCategorias,
};
