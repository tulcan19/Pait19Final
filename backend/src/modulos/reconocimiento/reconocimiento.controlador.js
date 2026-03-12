const reconocimientoServicio = require("./reconocimiento.servicio");
const pool = require("../../config/base_datos");
const logger = require("../../utils/logger");

async function identificarBotella(req, res, next) {
  try {
    const { imagen } = req.body;

    if (!imagen) {
      return res.status(400).json({ ok: false, mensaje: "Se requiere una imagen en formato base64." });
    }

    // 1. Llamar al servicio de IA
    const datosIA = await reconocimientoServicio.reconocerBotella(imagen);

    // 2. Buscar en PostgreSQL usando ILIKE para encontrar coincidencias aproximadas
    // Si la IA identificó una marca, buscamos productos similares
    let productosSugeridos = [];

    if (datosIA.marca) {
      const terminoBusqueda = `%${datosIA.marca}%`;
      // Buscar también por tipo si existe para refinar
      const terminoTipo = datosIA.tipo_licor ? `%${datosIA.tipo_licor}%` : '%';

      const consulta = `
        SELECT p.id_producto, p.nombre, p.descripcion, p.precio, p.stock, p.imagen, c.nombre as categoria
        FROM productos p
        LEFT JOIN categorias c ON p.id_categoria = c.id_categoria
        WHERE (p.nombre ILIKE $1 OR p.descripcion ILIKE $1)
           OR (p.nombre ILIKE $2 OR p.descripcion ILIKE $2)
        ORDER BY p.nombre
        LIMIT 5
      `;

      const resultado = await pool.query(consulta, [terminoBusqueda, terminoTipo]);
      productosSugeridos = resultado.rows;
    }

    // Buscar alternativas por tipo si no se encontró por marca, o sugerencias extra
    if (productosSugeridos.length === 0 && datosIA.tipo_licor) {
      const terminoTipo = `%${datosIA.tipo_licor}%`;
      const consultaTipo = `
        SELECT p.id_producto, p.nombre, p.descripcion, p.precio, p.stock, p.imagen, c.nombre as categoria
        FROM productos p
        LEFT JOIN categorias c ON p.id_categoria = c.id_categoria
        WHERE p.nombre ILIKE $1 OR p.descripcion ILIKE $1 OR c.nombre ILIKE $1
        ORDER BY p.stock DESC
        LIMIT 5
      `;
      const resultadoTipo = await pool.query(consultaTipo, [terminoTipo]);
      productosSugeridos = resultadoTipo.rows;
    }

    res.json({
      ok: true,
      reconocimiento: datosIA,
      sugerencias: productosSugeridos
    });

  } catch (error) {
    logger.error("Error en el controlador de reconocimiento:", error);
    next(error);
  }
}

module.exports = {
  identificarBotella
};
