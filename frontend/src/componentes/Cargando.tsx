import '../estilos/cargando.css';

interface PropsCargando {
  mensaje?: string;
  tamano?: 'pequeno' | 'mediano' | 'grande';
}

export function Cargando({ mensaje = 'Cargando...', tamano = 'mediano' }: PropsCargando) {
  return (
    <div className={`contenedor-cargando cargando-${tamano}`}>
      <div className="spinner"></div>
      {mensaje && <p className="mensaje-cargando">{mensaje}</p>}
    </div>
  );
}
