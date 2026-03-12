import "../estilos/dashboard.css";

const AccesoDenegado = ({ volver }: { volver: () => void }) => {
  return (
    <div className="dashboard">
      <div className="dashboard-contenedor">
        <div className="card">
          <h2 style={{ marginTop: 0 }}>⛔ Acceso denegado</h2>
          <p>No tienes permisos para acceder a esta sección.</p>

          <button className="btn-salir" onClick={volver}>
            Volver al Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccesoDenegado;
