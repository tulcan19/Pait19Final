import { useEffect, useMemo, useState, useCallback } from "react";
import api from "../api/api";
import { obtenerToken } from "../api/autenticacion";
import "../estilos/dashboard.css";
import "../estilos/movimientos.css";
import "../estilos/gastos.css";
import { esAdmin, esSupervisor } from "../contextos/sesion";
import { validarMonto } from "../helpers/validaciones";
import { formatearDinero } from "../helpers/validaciones";

type Gasto = {
  id_gasto: number;
  concepto: string;
  monto: number;
  fecha: string;
  id_usuario: number;
  observacion?: string;
  categoria?: string | null;
  usuario?: string;
};

const CATEGORIAS_GASTO = [
  { valor: "", etiqueta: "Sin categoría" },
  { valor: "transporte", etiqueta: "Transporte" },
  { valor: "servicios", etiqueta: "Servicios" },
  { valor: "mantenimiento", etiqueta: "Mantenimiento" },
  { valor: "suministros", etiqueta: "Suministros" },
  { valor: "otros", etiqueta: "Otros" },
];

const Gastos = ({ volver }: { volver: () => void }) => {
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState("");
  const [tipoMensaje, setTipoMensaje] = useState<"exito" | "error" | "advertencia">("error");
  const [procesando, setProcesando] = useState(false);

  const [concepto, setConcepto] = useState("");
  const [monto, setMonto] = useState<string>("");
  const [observacion, setObservacion] = useState("");
  const [categoria, setCategoria] = useState("");

  const [filtroCategoria, setFiltroCategoria] = useState<string>("todas");
  const [busqueda, setBusqueda] = useState("");

  const puedeRegistrar = esAdmin() || esSupervisor();

  const headers = useMemo(() => {
    const token = obtenerToken();
    return { Authorization: `Bearer ${token}` };
  }, []);

  const cargar = useCallback(async () => {
    setCargando(true);
    setMensaje("");
    try {
      const resp = await api.get("/gastos", { headers });
      setGastos(resp.data.gastos || []);
    } catch {
      setMensaje("No se pudieron cargar los gastos");
      setTipoMensaje("error");
    } finally {
      setCargando(false);
    }
  }, [headers]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const mostrarMensaje = (texto: string, tipo: "exito" | "error" | "advertencia") => {
    setMensaje(texto);
    setTipoMensaje(tipo);
    if (tipo === "exito") setTimeout(() => setMensaje(""), 3000);
  };

  const registrar = async () => {
    setMensaje("");

    if (!puedeRegistrar) {
      mostrarMensaje("Solo Administrador o Supervisor pueden registrar gastos", "error");
      return;
    }

    if (!concepto.trim()) {
      mostrarMensaje("El concepto es obligatorio", "advertencia");
      return;
    }

    const montoNum = parseFloat(monto);
    const validacionMonto = validarMonto(montoNum, 0.01);
    if (!validacionMonto.valido) {
      mostrarMensaje(validacionMonto.mensaje || "Monto inválido", "advertencia");
      return;
    }

    setProcesando(true);
    try {
      await api.post(
        "/gastos",
        { concepto: concepto.trim(), monto: montoNum, observacion: observacion.trim() || null, categoria: categoria || null },
        { headers }
      );

      setConcepto("");
      setMonto("");
      setObservacion("");
      setCategoria("");
      mostrarMensaje("Gasto registrado correctamente", "exito");
      await cargar();
    } catch (e: any) {
      const msg = e?.response?.data?.mensaje || "Error al registrar gasto";
      mostrarMensaje(msg, "error");
    } finally {
      setProcesando(false);
    }
  };

  const total = useMemo(() => {
    return gastos.reduce((acc, g) => acc + Number(g.monto || 0), 0);
  }, [gastos]);

  const gastosFiltrados = useMemo(() => {
    return gastos.filter((g) => {
      if (filtroCategoria !== "todas" && (g.categoria || "") !== filtroCategoria) return false;
      const termino = busqueda.trim().toLowerCase();
      if (!termino) return true;
      return (
        (g.concepto || "").toLowerCase().includes(termino) ||
        (g.observacion || "").toLowerCase().includes(termino) ||
        (g.categoria || "").toLowerCase().includes(termino)
      );
    });
  }, [gastos, filtroCategoria, busqueda]);

  const claseCategoria = (cat: string | null | undefined) => {
    if (!cat) return "otros";
    return cat;
  };

  return (
    <div className="card">
      <div className="topbar" style={{ marginBottom: "var(--espaciado-md)" }}>
        <div>
          <h1 style={{ margin: 0 }}>Gastos</h1>
          <div className="badge">
            <span className="material-symbols-outlined">payments</span>
            <span>Registro y control de egresos</span>
            <span className={`pill ${esSupervisor() ? "advertencia" : "primario"}`}>
              {puedeRegistrar ? "Registro habilitado" : "Solo lectura"}
            </span>
          </div>
        </div>
        <button className="btn-salir" onClick={volver}>
          ← Volver
        </button>
      </div>

      {puedeRegistrar && (
        <div className="card" style={{ marginBottom: "var(--espaciado-md)" }}>
          <p className="card-titulo">Registrar gasto</p>

          <div className="form-grid">
            <div className="campo full">
              <label className="label requerido">Concepto</label>
              <input
                className="input"
                value={concepto}
                onChange={(e) => setConcepto(e.target.value)}
                placeholder="Ej. Transporte, servicios, mantenimiento"
                disabled={!puedeRegistrar}
                maxLength={150}
              />
            </div>

            <div className="campo">
              <label className="label requerido">Monto</label>
              <input
                className="input"
                type="number"
                min={0.01}
                step="0.01"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                placeholder="0.00"
                disabled={!puedeRegistrar}
              />
            </div>

            <div className="campo">
              <label className="label">Categoría</label>
              <select
                className="select"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                disabled={!puedeRegistrar}
              >
                {CATEGORIAS_GASTO.map((c) => (
                  <option key={c.valor || "vacio"} value={c.valor}>
                    {c.etiqueta}
                  </option>
                ))}
              </select>
            </div>

            <div className="campo full">
              <label className="label">Observación</label>
              <input
                className="input"
                value={observacion}
                onChange={(e) => setObservacion(e.target.value)}
                placeholder="Observación (opcional)"
                disabled={!puedeRegistrar}
                maxLength={255}
              />
            </div>

            <div className="fila full" style={{ justifyContent: "flex-end", marginBottom: 0 }}>
              <button
                className="btn-primario"
                onClick={registrar}
                disabled={!puedeRegistrar || procesando}
              >
                {procesando ? "Registrando..." : "Registrar gasto"}
              </button>
            </div>
          </div>
        </div>
      )}

      {mensaje && (
        <div className={`mensaje ${tipoMensaje}`} style={{ marginBottom: "var(--espaciado-md)" }}>
          {mensaje}
        </div>
      )}

      <div className="gastos-resumen" style={{ marginBottom: "var(--espaciado-md)" }}>
        <div className="gasto-resumen-item">
          <div className="gasto-resumen-valor">$ {formatearDinero(total)}</div>
          <div className="gasto-resumen-etiqueta">Total gastos</div>
        </div>
      </div>

      <div className="filtros">
        <input
          className="input"
          placeholder="Buscar por concepto, observación o categoría..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <select
          className="select"
          value={filtroCategoria}
          onChange={(e) => setFiltroCategoria(e.target.value)}
        >
          <option value="todas">Todas las categorías</option>
          {CATEGORIAS_GASTO.filter((c) => c.valor).map((c) => (
            <option key={c.valor} value={c.valor}>
              {c.etiqueta}
            </option>
          ))}
        </select>
        <button className="btn-secundario" onClick={cargar} disabled={cargando} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {cargando ? "..." : <span className="material-symbols-outlined">refresh</span>}
        </button>
      </div>

      {cargando ? (
        <div className="loading">
          <div className="loading-spinner"></div>
          Cargando gastos...
        </div>
      ) : (
        <div className="tabla-contenedor">
          <table className="tabla">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Concepto</th>
                <th>Categoría</th>
                <th>Monto</th>
                <th className="ocultar-movil">Usuario</th>
                <th className="ocultar-movil">Obs.</th>
              </tr>
            </thead>
            <tbody>
              {gastosFiltrados.map((g) => (
                <tr key={g.id_gasto}>
                  <td>{new Date(g.fecha).toLocaleDateString()}</td>
                  <td style={{ fontWeight: 500 }}>{g.concepto}</td>
                  <td>
                    {g.categoria ? (
                      <span className={`gasto-categoria ${claseCategoria(g.categoria)}`}>
                        {CATEGORIAS_GASTO.find((c) => c.valor === g.categoria)?.etiqueta || g.categoria}
                      </span>
                    ) : (
                      <span style={{ color: "var(--color-texto-muted)" }}>-</span>
                    )}
                  </td>
                  <td style={{ fontWeight: 600 }}>$ {formatearDinero(g.monto)}</td>
                  <td className="ocultar-movil">{g.usuario || "-"}</td>
                  <td className="ocultar-movil" style={{ color: "var(--color-texto-muted)", maxWidth: 150 }} title={g.observacion || ""}>
                    {g.observacion ? (g.observacion.length > 30 ? g.observacion.slice(0, 30) + "…" : g.observacion) : "-"}
                  </td>
                </tr>
              ))}
              {gastosFiltrados.length === 0 && (
                <tr>
                  <td colSpan={6} className="loading">
                    {busqueda || filtroCategoria !== "todas"
                      ? "No hay gastos con ese criterio"
                      : "No hay gastos registrados"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ marginTop: "var(--espaciado-md)", color: "var(--color-texto-muted)", fontSize: "var(--texto-sm)" }}>
        Mostrando {gastosFiltrados.length} de {gastos.length} gasto(s)
      </div>
    </div>
  );
};

export default Gastos;
