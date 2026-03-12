/**
 * Sistema de auditoría empresarial
 * Registra todas las acciones importantes de los usuarios
 */

const pool = require('../config/base_datos');
const logger = require('./logger');

/**
 * Crea una entrada de auditoría en la base de datos
 */
async function registrarAuditoria(usuarioId, accion, modulo, detalles = {}) {
  try {
    const query = `
      INSERT INTO auditoria (
        usuario_id,
        accion,
        modulo,
        detalles,
        fecha_hora,
        ip_address
      ) VALUES ($1, $2, $3, $4, NOW(), $5)
      RETURNING id
    `;

    const ipAddress = detalles.ip || 'Desconocido';
    const detallesJson = JSON.stringify(detalles);

    await pool.query(query, [usuarioId, accion, modulo, detallesJson, ipAddress]);
    
    logger.auditoria(accion, { id_usuario: usuarioId }, { modulo, ...detalles });
  } catch (error) {
    // No fallar la operación principal si falla la auditoría
    logger.error('Error registrando auditoría', { error: error.message, usuarioId, accion, modulo });
  }
}

/**
 * Middleware para registrar automáticamente acciones
 */
function middlewareAuditoria(accion, modulo) {
  return async (req, res, next) => {
    // Guardar la función original de res.json
    const originalJson = res.json.bind(res);
    
    // Interceptar la respuesta
    res.json = function(data) {
      // Si la operación fue exitosa, registrar auditoría
      if (data.ok !== false && req.usuario) {
        const detalles = {
          metodo: req.method,
          ruta: req.originalUrl,
          ip: req.ip || req.connection.remoteAddress,
          body: req.method !== 'GET' ? req.body : undefined,
          params: req.params,
          resultado: 'exitoso',
        };

        registrarAuditoria(
          req.usuario.id_usuario,
          accion,
          modulo,
          detalles
        );
      }
      
      return originalJson(data);
    };
    
    next();
  };
}

/**
 * Obtiene el historial de auditoría
 */
async function obtenerAuditoria(filtros = {}) {
  try {
    let query = `
      SELECT 
        a.id,
        a.usuario_id,
        u.nombre as usuario_nombre,
        a.accion,
        a.modulo,
        a.detalles,
        a.fecha_hora,
        a.ip_address
      FROM auditoria a
      LEFT JOIN usuarios u ON a.usuario_id = u.id_usuario
      WHERE 1=1
    `;
    
    const valores = [];
    let contador = 1;

    if (filtros.usuario_id) {
      query += ` AND a.usuario_id = $${contador}`;
      valores.push(filtros.usuario_id);
      contador++;
    }

    if (filtros.modulo) {
      query += ` AND a.modulo = $${contador}`;
      valores.push(filtros.modulo);
      contador++;
    }

    if (filtros.fecha_desde) {
      query += ` AND a.fecha_hora >= $${contador}`;
      valores.push(filtros.fecha_desde);
      contador++;
    }

    if (filtros.fecha_hasta) {
      query += ` AND a.fecha_hora <= $${contador}`;
      valores.push(filtros.fecha_hasta);
      contador++;
    }

    query += ` ORDER BY a.fecha_hora DESC LIMIT $${contador}`;
    valores.push(filtros.limite || 100);

    const resultado = await pool.query(query, valores);
    return resultado.rows;
  } catch (error) {
    logger.error('Error obteniendo auditoría', { error: error.message });
    throw error;
  }
}

module.exports = {
  registrarAuditoria,
  middlewareAuditoria,
  obtenerAuditoria,
};
