const tiendaRepositorio = require("./tienda.repositorio");
const fs = require("fs");
const path = require("path");

const CONFIG_PATH = path.join(__dirname, "../../../configuracion_tienda.json");

const defaultConfig = {
    telefono: "0123-456-789",
    email: "contacto@sierrastock.com",
    heroSlides: [
        { titulo: "CRAFT BEER", subtitulo: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.", boton: "SEE MORE" },
        { titulo: "PREMIUM WHISKY", subtitulo: "Descubre nuestra colección exclusiva de whiskies.", boton: "EXPLORAR" },
        { titulo: "FINE WINES", subtitulo: "Los mejores vinos de las bodegas más prestigiosas.", boton: "VER MÁS" }
    ],
    navLinks: ["NUEVOS", "ESPECIALES", "BEST SELLERS"],
    banners: [
        { label: "NUEVA CATEGORÍA", desc: "LOREM IPSUM DOLOR SIT AMET" },
        { label: "NUEVA CATEGORÍA", desc: "LOREM IPSUM DOLOR SIT AMET" },
        { label: "NUEVA CATEGORÍA", desc: "LOREM IPSUM DOLOR SIT AMET" }
    ]
};

function readConfig() {
    if (fs.existsSync(CONFIG_PATH)) {
        try {
            return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
        } catch (e) {
            console.error("Error leyendo configuracion_tienda.json", e);
        }
    }
    return defaultConfig;
}

function writeConfig(config) {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), "utf8");
}

async function obtenerProductos(req, res) {
    try {
        const { categoria, busqueda, limite = 20, pagina = 1 } = req.query;
        const offset = (parseInt(pagina) - 1) * parseInt(limite);

        const [productos, total] = await Promise.all([
            tiendaRepositorio.listarProductosActivos({
                categoria: categoria ? parseInt(categoria) : null,
                busqueda: busqueda || null,
                limite: parseInt(limite),
                offset,
            }),
            tiendaRepositorio.contarProductosActivos({
                categoria: categoria ? parseInt(categoria) : null,
                busqueda: busqueda || null,
            }),
        ]);

        return res.json({
            ok: true,
            productos,
            total,
            pagina: parseInt(pagina),
            totalPaginas: Math.ceil(total / parseInt(limite)),
        });
    } catch (error) {
        console.error("Error obtener productos tienda:", error);
        return res.status(500).json({ mensaje: "Error interno del servidor" });
    }
}

async function obtenerProducto(req, res) {
    try {
        const id_producto = Number(req.params.id);
        if (!id_producto) return res.status(400).json({ mensaje: "ID inválido" });

        const producto = await tiendaRepositorio.obtenerProductoPorId(id_producto);
        if (!producto) return res.status(404).json({ mensaje: "Producto no encontrado" });

        return res.json({ ok: true, producto });
    } catch (error) {
        console.error("Error obtener producto tienda:", error);
        return res.status(500).json({ mensaje: "Error interno del servidor" });
    }
}

async function obtenerCategorias(req, res) {
    try {
        const categorias = await tiendaRepositorio.listarCategorias();
        return res.json({ ok: true, categorias });
    } catch (error) {
        console.error("Error obtener categorías tienda:", error);
        return res.status(500).json({ mensaje: "Error interno del servidor" });
    }
}

async function obtenerDestacados(req, res) {
    try {
        const limite = parseInt(req.query.limite) || 8;
        const productos = await tiendaRepositorio.listarDestacados(limite);
        return res.json({ ok: true, productos });
    } catch (error) {
        console.error("Error obtener destacados:", error);
        return res.status(500).json({ mensaje: "Error interno del servidor" });
    }
}

module.exports = {
    obtenerProductos,
    obtenerProducto,
    obtenerCategorias,
    obtenerDestacados,
    obtenerConfiguracion: (req, res) => {
        try {
            const config = readConfig();
            res.json({ ok: true, configuracion: config });
        } catch (error) {
            console.error("Error obtener configuracion:", error);
            res.status(500).json({ mensaje: "Error interno del servidor" });
        }
    },
    actualizarConfiguracion: (req, res) => {
        try {
            const nuevaConfig = req.body;
            writeConfig(nuevaConfig);
            res.json({ ok: true, mensaje: "Configuración actualizada correctamente" });
        } catch (error) {
            console.error("Error actualizar configuracion:", error);
            res.status(500).json({ mensaje: "Error interno del servidor" });
        }
    }
};
