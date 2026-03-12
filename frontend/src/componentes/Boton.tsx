import '../estilos/boton.css';

interface PropsBoton {
  children: React.ReactNode;
  onClick?: () => void;
  tipo?: 'primario' | 'secundario' | 'peligro' | 'texto';
  tamano?: 'pequeno' | 'mediano' | 'grande';
  deshabilitado?: boolean;
  cargando?: boolean;
  tipoBoton?: 'button' | 'submit' | 'reset';
  className?: string;
}

export function Boton({
  children,
  onClick,
  tipo = 'primario',
  tamano = 'mediano',
  deshabilitado = false,
  cargando = false,
  tipoBoton = 'button',
  className = '',
}: PropsBoton) {
  return (
    <button
      type={tipoBoton}
      className={`boton boton-${tipo} boton-${tamano} ${className}`}
      onClick={onClick}
      disabled={deshabilitado || cargando}
    >
      {cargando ? (
        <>
          <span className="boton-spinner"></span>
          <span>Cargando...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
