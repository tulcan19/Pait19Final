const { Pool } = require("pg");
require("dotenv").config();
const logger = require("../utils/logger");

const pool = new Pool({
  host: process.env.BD_HOST,
  port: Number(process.env.BD_PUERTO),
  user: process.env.BD_USUARIO,
  password: process.env.BD_CONTRASENA,
  database: process.env.BD_NOMBRE,
  // Configuración de pool para producción
  max: 20, // máximo de clientes en el pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on("error", (err) => {
  logger.error("Error inesperado en PostgreSQL", { error: err.message, stack: err.stack });
});

pool.on("connect", () => {
  logger.debug("Nueva conexión a PostgreSQL establecida");
});

// Test de conexión al iniciar
pool.query("SELECT NOW()")
  .then(() => {
    logger.info("Conexión a PostgreSQL establecida correctamente", {
      host: process.env.BD_HOST,
      database: process.env.BD_NOMBRE,
    });
  })
  .catch((err) => {
    logger.error("Error al conectar con PostgreSQL", {
      error: err.message,
      host: process.env.BD_HOST,
      database: process.env.BD_NOMBRE,
    });
  });

module.exports = pool;
