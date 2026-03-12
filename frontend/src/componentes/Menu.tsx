import "../estilos/dashboard.css";
import { esAdmin, esOperador, esSupervisor } from "../contextos/sesion";

type Pantalla = "dashboard" | "movimientos" | "gastos";

const Menu = ({ ir }: { ir: (p: Pantalla) => void }) => {
  return (
    <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
      <button className="btn-salir" onClick={() => ir("dashboard")}>
        Dashboard
      </button>

      {(esAdmin() || esOperador() || esSupervisor()) && (
        <button className="btn-salir" onClick={() => ir("movimientos")}>
          Movimientos
        </button>
      )}

      {esAdmin() && (
        <button className="btn-salir" onClick={() => ir("gastos")}>
          Gastos
        </button>
      )}
    </div>
  );
};

export default Menu;
export type { Pantalla };
