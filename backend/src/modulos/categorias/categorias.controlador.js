const categoriasServicio = require("./categorias.servicio");

async function crear(req, res) {
  try {
    const { nombre, descripcion, imagen } = req.body;

    if (!nombre) {
      return res.status(400).json({ mensaje: "El nombre es obligatorio" });
    }

    const resultado = await categoriasServicio.registrarCategoria({
      nombre,
      descripcion,
      imagen,
    });
    return res
      .status(201)
      .json({ mensaje: "✅ Categoría creada", ...resultado });
  } catch (error) {
    console.error("Error crear categoría:", error);
    return res.status(500).json({ mensaje: "Error interno del servidor" });
  }
}

async function actualizar(req, res) {
  try {
    const { id_categoria } = req.params;
    const { nombre, descripcion, imagen } = req.body;

    if (!nombre) {
      return res.status(400).json({ mensaje: "El nombre es obligatorio" });
    }

    const resultado = await categoriasServicio.editarCategoria(id_categoria, {
      nombre,
      descripcion,
      imagen,
    });
    if (!resultado.ok) {
      return res.status(404).json(resultado);
    }

    return res.json({ mensaje: "✅ Categoría actualizada", ...resultado });
  } catch (error) {
    console.error("Error actualizar categoría:", error);
    return res.status(500).json({
      mensaje: `❌ Error interno: ${error.message}`,
      error: error.message
    });
  }
}

async function listar(req, res) {
  try {
    const resultado = await categoriasServicio.obtenerCategorias();
    return res.json(resultado);
  } catch (error) {
    console.error("Error listar categorías:", error);
    return res.status(500).json({ mensaje: "Error interno del servidor" });
  }
}

module.exports = {
  crear,
  actualizar,
  listar,
};
