import { useEffect } from 'react';
import '../estilos/modal.css';

interface PropsModal {
  titulo: string;
  abierto: boolean;
  onCerrar: () => void;
  children: React.ReactNode;
  tamano?: 'pequeno' | 'mediano' | 'grande';
  mostrarCerrar?: boolean;
}

export function Modal({
  titulo,
  abierto,
  onCerrar,
  children,
  tamano = 'mediano',
  mostrarCerrar = true,
}: PropsModal) {
  useEffect(() => {
    if (abierto) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [abierto]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && abierto) {
        onCerrar();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [abierto, onCerrar]);

  if (!abierto) return null;

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div
        className={`modal-contenido modal-${tamano}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 className="modal-titulo">{titulo}</h2>
          {mostrarCerrar && (
            <button className="modal-cerrar" onClick={onCerrar}>
              ×
            </button>
          )}
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
