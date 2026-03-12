import { useEffect, useState } from 'react';
import { notificaciones, type Notificacion, type TipoNotificacion } from '../utils/notificaciones';
import '../estilos/notificaciones.css';

interface PropsNotificacion {
  notificacion: Notificacion;
  onCerrar: () => void;
}

function NotificacionItem({ notificacion, onCerrar }: PropsNotificacion) {
  const getIcono = (tipo: TipoNotificacion) => {
    switch (tipo) {
      case 'exito':
        return '✓';
      case 'error':
        return '✕';
      case 'advertencia':
        return '⚠';
      case 'info':
        return 'ℹ';
      default:
        return '';
    }
  };

  return (
    <div className={`notificacion notificacion-${notificacion.tipo}`}>
      <div className="notificacion-icono">{getIcono(notificacion.tipo)}</div>
      <div className="notificacion-contenido">
        <div className="notificacion-titulo">{notificacion.titulo}</div>
        {notificacion.mensaje && (
          <div className="notificacion-mensaje">{notificacion.mensaje}</div>
        )}
      </div>
      <button className="notificacion-cerrar" onClick={onCerrar}>
        ×
      </button>
    </div>
  );
}

export function Notificaciones() {
  const [notifs, setNotifs] = useState<Notificacion[]>([]);

  useEffect(() => {
    const unsubscribe = notificaciones.suscribir(setNotifs);
    return unsubscribe;
  }, []);

  if (notifs.length === 0) return null;

  return (
    <div className="contenedor-notificaciones">
      {notifs.map(notif => (
        <NotificacionItem
          key={notif.id}
          notificacion={notif}
          onCerrar={() => notificaciones.eliminar(notif.id)}
        />
      ))}
    </div>
  );
}
