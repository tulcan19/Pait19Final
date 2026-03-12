const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const logger = require("./utils/logger");
const { manejarErrores } = require("./utils/manejoErrores");

// Rutas
const autenticacionRutas = require("./rutas/autenticacion.rutas");
const usuariosRutas = require("./rutas/usuarios.rutas");
const productosRutas = require("./rutas/productos.rutas");
const categoriasRutas = require("./rutas/categorias.rutas");
const proveedoresRutas = require("./rutas/proveedores.rutas");
const inventarioRutas = require("./rutas/inventario.rutas");
const comprasRutas = require("./rutas/compras.rutas");
const ventasRutas = require("./rutas/ventas.rutas");
const dashboardRutas = require("./rutas/dashboard.rutas");
const gastosRutas = require("./rutas/gastos.rutas");
const movimientosRutas = require("./rutas/movimientos.rutas");
const clientesRutas = require("./rutas/clientes.rutas");
const reportesRutas = require("./rutas/reportes.rutas");
const auditoriaRutas = require("./rutas/auditoria.rutas");
const exportarRutas = require("./rutas/exportar.rutas");
const reconocimientoRutas = require("./modulos/reconocimiento/reconocimiento.rutas");
const tiendaRutas = require("./rutas/tienda.rutas");
const chatbotRutas = require("./modulos/chatbot/chatbot.rutas");

const app = express();

// Seguridad: Helmet para headers de seguridad
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS configurado
const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Rate limiting general
const limiterGeneral = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por ventana
  message: {
    ok: false,
    error: {
      codigo: "DEMASIADAS_SOLICITUDES",
      mensaje: "Demasiadas solicitudes desde esta IP, intenta de nuevo más tarde",
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting estricto para autenticación
const limiterAutenticacion = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 intentos de login
  message: {
    ok: false,
    error: {
      codigo: "DEMASIADOS_INTENTOS",
      mensaje: "Demasiados intentos de inicio de sesión, intenta de nuevo más tarde",
    },
  },
  skipSuccessfulRequests: true,
});

app.use("/api/", limiterGeneral);
app.use("/api/autenticacion/login", limiterAutenticacion);

// Body parsers
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Logging de requests
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl}`, {
    ip: req.ip,
    userAgent: req.get("user-agent"),
  });
  next();
});

// Ruta de salud mejorada
app.get("/api/salud", (req, res) => {
  res.json({
    ok: true,
    mensaje: "✅ API funcionando correctamente",
    version: "2.0.0",
    timestamp: new Date().toISOString(),
    entorno: process.env.NODE_ENV || "development",
  });
});

// Rutas de la API
app.use("/api/autenticacion", autenticacionRutas);
app.use("/api/usuarios", usuariosRutas);
app.use("/api/productos", productosRutas);
app.use("/api/categorias", categoriasRutas);
app.use("/api/proveedores", proveedoresRutas);
app.use("/api/inventario", inventarioRutas);
app.use("/api/compras", comprasRutas);
app.use("/api/ventas", ventasRutas);
app.use("/api/dashboard", dashboardRutas);
app.use("/api/gastos", gastosRutas);
app.use("/api/movimientos", movimientosRutas);
app.use("/api/clientes", clientesRutas);
app.use("/api/reportes", reportesRutas);
app.use("/api/auditoria", auditoriaRutas);
app.use("/api/exportar", exportarRutas);
app.use("/api/reconocimiento", reconocimientoRutas);
app.use("/api/tienda", tiendaRutas);
app.use("/api/chatbot", chatbotRutas);

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({
    ok: false,
    error: {
      codigo: "RUTA_NO_ENCONTRADA",
      mensaje: "La ruta solicitada no existe",
      ruta: req.originalUrl,
    },
  });
});

// Middleware de manejo de errores (debe ir al final)
app.use(manejarErrores);

module.exports = app;
