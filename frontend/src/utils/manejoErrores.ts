/**
 * Manejo centralizado de errores en el frontend
 */

import { notificaciones } from './notificaciones';
import { AxiosError } from 'axios';

export interface ErrorAPI {
  ok: false;
  error: {
    codigo: string;
    mensaje: string;
    detalles?: any;
    timestamp: string;
  };
}

/**
 * Maneja errores de la API y muestra notificaciones apropiadas
 */
export function manejarErrorAPI(error: unknown): void {
  if (error instanceof AxiosError) {
    const respuesta = error.response?.data as ErrorAPI | undefined;

      if (respuesta?.error) {
        const { codigo, mensaje } = respuesta.error;

      // Mensajes personalizados según el código de error
      let titulo = 'Error';
      let mensajeMostrar = mensaje;

      switch (codigo) {
        case 'NO_AUTORIZADO':
        case 'TOKEN_INVALIDO':
          titulo = 'Sesión expirada';
          mensajeMostrar = 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.';
          // Redirigir al login
          setTimeout(() => {
            localStorage.removeItem('token');
            window.location.href = '/';
          }, 2000);
          break;

        case 'PERMISOS_INSUFICIENTES':
          titulo = 'Acceso denegado';
          mensajeMostrar = 'No tienes permisos para realizar esta acción.';
          break;

        case 'ERROR_VALIDACION':
          titulo = 'Error de validación';
          mensajeMostrar = mensaje || 'Los datos proporcionados no son válidos.';
          break;

        case 'RECURSO_NO_ENCONTRADO':
          titulo = 'No encontrado';
          mensajeMostrar = 'El recurso solicitado no existe.';
          break;

        case 'DEMASIADAS_SOLICITUDES':
        case 'DEMASIADOS_INTENTOS':
          titulo = 'Demasiadas solicitudes';
          mensajeMostrar = 'Has realizado demasiadas solicitudes. Intenta de nuevo más tarde.';
          break;

        case 'ERROR_INTERNO':
          titulo = 'Error del servidor';
          mensajeMostrar = 'Ocurrió un error en el servidor. Por favor, intenta más tarde.';
          break;

        default:
          titulo = 'Error';
          mensajeMostrar = mensaje || 'Ocurrió un error inesperado.';
      }

      notificaciones.error(titulo, mensajeMostrar);
    } else if (error.message) {
      notificaciones.error('Error de conexión', error.message);
    } else {
      notificaciones.error('Error', 'No se pudo conectar con el servidor.');
    }
  } else if (error instanceof Error) {
    notificaciones.error('Error', error.message);
  } else {
    notificaciones.error('Error', 'Ocurrió un error inesperado.');
  }
}

/**
 * Wrapper para funciones async que maneja errores automáticamente
 */
export async function ejecutarConManejoErrores<T>(
  fn: () => Promise<T>,
  mensajeExito?: string
): Promise<T | null> {
  try {
    const resultado = await fn();
    if (mensajeExito) {
      notificaciones.exito(mensajeExito);
    }
    return resultado;
  } catch (error) {
    manejarErrorAPI(error);
    return null;
  }
}
