const subcategoriasRepositorio = require("./subcategorias.repositorio");

async function crear(req, res) {
  try {
    const { id_categoria, nombre, id_categoria_vinculada } = req.body;
    if (!id_categoria || (!nombre && !id_categoria_vinculada)) {
      return res.status(400).json({ ok: false, mensaje: "Categoría y (nombre o vínculo) son requeridos" });
    }
    const subcategoria = await subcategoriasRepositorio.crearSubcategoria({ id_categoria, nombre, id_categoria_vinculada });
    res.status(201).json({ ok: true, subcategoria });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, mensaje: "Error al crear subcategoría" });
  }
}

async function listarPorCategoria(req, res) {
  try {
    const { id_categoria } = req.params;
    const subcategorias = await subcategoriasRepositorio.listarSubcategoriasPorCategoria(id_categoria);
    res.json({ ok: true, subcategorias });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, mensaje: "Error al listar subcategorías" });
  }
}

async function actualizar(req, res) {
  try {
    const { id } = req.params;
    const { nombre, activo, id_categoria_vinculada } = req.body;
    const subcategoria = await subcategoriasRepositorio.actualizarSubcategoria(id, { nombre, activo, id_categoria_vinculada });
    if (!subcategoria) {
      return res.status(404).json({ ok: false, mensaje: "Subcategoría no encontrada" });
    }
    res.json({ ok: true, subcategoria });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, mensaje: "Error al actualizar subcategoría" });
  }
}

async function eliminar(req, res) {
  try {
    const { id } = req.params;
    const subcategoria = await subcategoriasRepositorio.eliminarSubcategoria(id);
    if (!subcategoria) {
      return res.status(404).json({ ok: false, mensaje: "Subcategoría no encontrada" });
    }
    res.json({ ok: true, mensaje: "Subcategoría eliminada" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, mensaje: "Error al eliminar subcategoría" });
  }
}

module.exports = {
  crear,
  listarPorCategoria,
  actualizar,
  eliminar,
};
