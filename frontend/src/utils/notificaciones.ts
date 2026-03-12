/**
 * Sistema de notificaciones empresarial
 * Maneja notificaciones toast de forma centralizada
 */

export type TipoNotificacion = 'exito' | 'error' | 'advertencia' | 'info';

export interface Notificacion {
  id: string;
  tipo: TipoNotificacion;
  titulo: string;
  mensaje: string;
  duracion?: number;
}

class NotificacionManager {
  private notificaciones: Notificacion[] = [];
  private listeners: Array<(notificaciones: Notificacion[]) => void> = [];

  /**
   * Suscribirse a cambios en las notificaciones
   */
  suscribir(listener: (notificaciones: Notificacion[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Notificar a los listeners
   */
  private notificar() {
    this.listeners.forEach(listener => listener([...this.notificaciones]));
  }

  /**
   * Agregar una notificación
   */
  agregar(tipo: TipoNotificacion, titulo: string, mensaje: string, duracion = 5000) {
    const id = `notif-${Date.now()}-${Math.random()}`;
    const notificacion: Notificacion = {
      id,
      tipo,
      titulo,
      mensaje,
      duracion,
    };

    this.notificaciones.push(notificacion);
    this.notificar();

    // Auto-eliminar después de la duración
    if (duracion > 0) {
      setTimeout(() => {
        this.eliminar(id);
      }, duracion);
    }

    return id;
  }

  /**
   * Eliminar una notificación
   */
  eliminar(id: string) {
    this.notificaciones = this.notificaciones.filter(n => n.id !== id);
    this.notificar();
  }

  /**
   * Limpiar todas las notificaciones
   */
  limpiar() {
    this.notificaciones = [];
    this.notificar();
  }

  /**
   * Métodos de conveniencia
   */
  exito(titulo: string, mensaje: string = '') {
    return this.agregar('exito', titulo, mensaje);
  }

  error(titulo: string, mensaje: string = '') {
    return this.agregar('error', titulo, mensaje, 7000);
  }

  advertencia(titulo: string, mensaje: string = '') {
    return this.agregar('advertencia', titulo, mensaje);
  }

  info(titulo: string, mensaje: string = '') {
    return this.agregar('info', titulo, mensaje);
  }
}

export const notificaciones = new NotificacionManager();
