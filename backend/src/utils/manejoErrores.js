/**
 * Manejo centralizado de errores empresarial
 * Proporciona respuestas consistentes y logging estructurado
 */

class ErrorAplicacion extends Error {
  constructor(mensaje, codigoEstado = 500, codigoError = 'ERROR_INTERNO', detalles = null) {
    super(mensaje);
    this.name = 'ErrorAplicacion';
    this.codigoEstado = codigoEstado;
    this.codigoError = codigoError;
    this.detalles = detalles;
    this.timestamp = new Date().toISOString();
    Error.captureStackTrace(this, this.constructor);
  }
}

class ErrorValidacion extends ErrorAplicacion {
  constructor(mensaje, detalles = null) {
    super(mensaje, 400, 'ERROR_VALIDACION', detalles);
    this.name = 'ErrorValidacion';
  }
}

class ErrorNoEncontrado extends ErrorAplicacion {
  constructor(mensaje = 'Recurso no encontrado', detalles = null) {
    super(mensaje, 404, 'RECURSO_NO_ENCONTRADO', detalles);
    this.name = 'ErrorNoEncontrado';
  }
}

class ErrorNoAutorizado extends ErrorAplicacion {
  constructor(mensaje = 'No autorizado', detalles = null) {
    super(mensaje, 401, 'NO_AUTORIZADO', detalles);
    this.name = 'ErrorNoAutorizado';
  }
}

class ErrorPermisosInsuficientes extends ErrorAplicacion {
  constructor(mensaje = 'Permisos insuficientes', detalles = null) {
    super(mensaje, 403, 'PERMISOS_INSUFICIENTES', detalles);
    this.name = 'ErrorPermisosInsuficientes';
  }
}

/**
 * Middleware para manejar errores de forma centralizada
 */
function manejarErrores(error, req, res, next) {
  // Log del error
  const logger = require('./logger');
  
  const errorInfo = {
    mensaje: error.message,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    url: req.originalUrl,
    metodo: req.method,
    ip: req.ip,
    usuario: req.usuario?.id_usuario || 'No autenticado',
    body: req.body,
    query: req.query,
    params: req.params,
  };

  // Si es un error conocido de la aplicación
  if (error instanceof ErrorAplicacion) {
    logger.warn('Error de aplicación', errorInfo);
    return res.status(error.codigoEstado).json({
      ok: false,
      error: {
        codigo: error.codigoError,
        mensaje: error.mensaje,
        detalles: error.detalles,
        timestamp: error.timestamp,
      },
    });
  }

  // Si es un error de validación de JWT
  if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
    logger.warn('Error de autenticación JWT', errorInfo);
    return res.status(401).json({
      ok: false,
      error: {
        codigo: 'TOKEN_INVALIDO',
        mensaje: 'Token inválido o expirado',
        timestamp: new Date().toISOString(),
      },
    });
  }

  // Si es un error de validación de base de datos
  if (error.code === '23505') { // Violación de constraint único
    logger.warn('Error de duplicado en BD', errorInfo);
    return res.status(409).json({
      ok: false,
      error: {
        codigo: 'RECURSO_DUPLICADO',
        mensaje: 'El recurso ya existe',
        detalles: error.detail,
        timestamp: new Date().toISOString(),
      },
    });
  }

  if (error.code === '23503') { // Violación de foreign key
    logger.warn('Error de referencia en BD', errorInfo);
    return res.status(400).json({
      ok: false,
      error: {
        codigo: 'REFERENCIA_INVALIDA',
        mensaje: 'Referencia inválida en la base de datos',
        timestamp: new Date().toISOString(),
      },
    });
  }

  // Error no esperado - log crítico
  logger.error('Error inesperado', errorInfo);
  
  // Respuesta genérica (no exponer detalles en producción)
  const mensaje = process.env.NODE_ENV === 'production' 
    ? 'Error interno del servidor' 
    : error.message;

  return res.status(500).json({
    ok: false,
    error: {
      codigo: 'ERROR_INTERNO',
      mensaje,
      timestamp: new Date().toISOString(),
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    },
  });
}

/**
 * Wrapper para manejar errores en funciones async
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = {
  ErrorAplicacion,
  ErrorValidacion,
  ErrorNoEncontrado,
  ErrorNoAutorizado,
  ErrorPermisosInsuficientes,
  manejarErrores,
  asyncHandler,
};
