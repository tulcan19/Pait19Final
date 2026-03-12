/**
 * Sistema de logging empresarial
 * Soporta diferentes niveles y formateo estructurado
 */

const fs = require('fs');
const path = require('path');

const niveles = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
};

const nivelActual = niveles[process.env.LOG_LEVEL?.toUpperCase()] ?? niveles.INFO;

// Crear directorio de logs si no existe
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Formatea el mensaje de log
 */
function formatearLog(nivel, mensaje, datos = {}) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    nivel,
    mensaje,
    ...datos,
  };

  return JSON.stringify(logEntry);
}

/**
 * Escribe en archivo de log
 */
function escribirArchivo(nivel, mensaje, datos) {
  const fecha = new Date().toISOString().split('T')[0];
  const archivoLog = path.join(logsDir, `${fecha}-${nivel.toLowerCase()}.log`);
  const logEntry = formatearLog(nivel, mensaje, datos) + '\n';

  fs.appendFile(archivoLog, logEntry, (err) => {
    if (err) {
      console.error('Error escribiendo log:', err);
    }
  });
}

/**
 * Logger principal
 */
const logger = {
  error: (mensaje, datos = {}) => {
    if (nivelActual >= niveles.ERROR) {
      const log = formatearLog('ERROR', mensaje, datos);
      console.error(log);
      escribirArchivo('ERROR', mensaje, datos);
    }
  },

  warn: (mensaje, datos = {}) => {
    if (nivelActual >= niveles.WARN) {
      const log = formatearLog('WARN', mensaje, datos);
      console.warn(log);
      escribirArchivo('WARN', mensaje, datos);
    }
  },

  info: (mensaje, datos = {}) => {
    if (nivelActual >= niveles.INFO) {
      const log = formatearLog('INFO', mensaje, datos);
      console.info(log);
      escribirArchivo('INFO', mensaje, datos);
    }
  },

  debug: (mensaje, datos = {}) => {
    if (nivelActual >= niveles.DEBUG) {
      const log = formatearLog('DEBUG', mensaje, datos);
      console.debug(log);
      if (process.env.NODE_ENV === 'development') {
        escribirArchivo('DEBUG', mensaje, datos);
      }
    }
  },

  // Logs específicos para auditoría
  auditoria: (accion, usuario, detalles = {}) => {
    const datosAuditoria = {
      accion,
      usuario_id: usuario?.id_usuario || usuario,
      usuario_nombre: usuario?.nombre || 'Desconocido',
      ...detalles,
    };
    
    const fecha = new Date().toISOString().split('T')[0];
    const archivoAuditoria = path.join(logsDir, `${fecha}-auditoria.log`);
    const logEntry = formatearLog('AUDITORIA', accion, datosAuditoria) + '\n';

    fs.appendFile(archivoAuditoria, logEntry, (err) => {
      if (err) {
        console.error('Error escribiendo auditoría:', err);
      }
    });
  },
};

module.exports = logger;
