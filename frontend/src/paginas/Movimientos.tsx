import { useEffect, useMemo, useState, useCallback } from "react";
import api from "../api/api";
import { obtenerToken } from "../api/autenticacion";
import "../estilos/dashboard.css";
import "../estilos/movimientos.css";
import { esAdmin, esOperador, esSupervisor } from "../contextos/sesion";

type Producto = {
  id_producto: number;
  nombre: string;
};

type Movimiento = {
  id_movimiento: number;
  id_producto: number;
  tipo: "entrada" | "salida" | "ajuste";
  cantidad: number;
  stock_anterior: number;
  stock_actual: number;
  fecha: string;
  id_usuario: number;
  producto?: string;
  usuario?: string;
  imagen?: string | null;
};

const Movimientos = ({ volver }: { volver: () => void }) => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState<React.ReactNode>("");

  const [idProducto, setIdProducto] = useState<number>(0);
  const [tipo, setTipo] = useState<"entrada" | "salida" | "ajuste">("entrada");
  const [cantidad, setCantidad] = useState<number>(1);

  const [filtroTipo, setFiltroTipo] = useState<"todos" | "entrada" | "salida" | "ajuste">("todos");
  const [filtroProducto, setFiltroProducto] = useState<number | "todos">("todos");

  const puedeRegistrar = esAdmin() || esOperador(); // Supervisor: solo lectura

  const headers = useMemo(() => {
    const token = obtenerToken();
    return { Authorization: `Bearer ${token}` };
  }, []);

  // ✅ ABRIR PDF DESDE FRONTEND
  const abrirPdfKardex = () => {
    const token = obtenerToken();
    if (!token) {
      setMensaje(<><span className="material-symbols-outlined">warning</span> No hay token. Inicia sesión nuevamente.</>);
      return;
    }

    // Armamos query params según filtros
    const params = new URLSearchParams();
    params.set("token", token);

    if (filtroTipo !== "todos") params.set("tipo", filtroTipo);
    if (filtroProducto !== "todos") params.set("id_producto", String(filtroProducto));

    const url = `http://localhost:3000/api/reportes/movimientos/pdf?${params.toString()}`;
    window.open(url, "_blank");
  };

  const cargarTodo = useCallback(async () => {
    setCargando(true);
    setMensaje("");
    try {
      const [respProd, respMov] = await Promise.all([
        api.get("/productos", { headers }),
        api.get("/movimientos", { headers }),
      ]);

      const listaProd = respProd.data.productos || [];
      setProductos(listaProd.map((p: any) => ({ id_producto: p.id_producto, nombre: p.nombre })));

      setMovimientos(respMov.data.movimientos || []);

      if (listaProd.length > 0 && !idProducto) {
        setIdProducto(listaProd[0].id_producto);
      }
    } catch {
      setMensaje(<><span className="material-symbols-outlined">error</span> No se pudo cargar productos o movimientos. Revisa token/backend.</>);
    } finally {
      setCargando(false);
    }
  }, [headers, idProducto]);

  useEffect(() => {
    cargarTodo();
  }, [cargarTodo]);

  const registrarMovimiento = async () => {
    setMensaje("");

    if (!puedeRegistrar) {
      setMensaje(<><span className="material-symbols-outlined">block</span> Supervisor no puede registrar movimientos.</>);
      return;
    }

    if (!idProducto) {
      setMensaje(<><span className="material-symbols-outlined">warning</span> Selecciona un producto.</>);
      return;
    }

    if (!cantidad || cantidad <= 0) {
      setMensaje(<><span className="material-symbols-outlined">warning</span> La cantidad debe ser mayor a 0.</>);
      return;
    }

    try {
      await api.post(
        "/movimientos",
        { id_producto: idProducto, tipo, cantidad },
        { headers }
      );

      setMensaje(<><span className="material-symbols-outlined">check_circle</span> Movimiento registrado</>);
      await cargarTodo();
    } catch (e: any) {
      const msg = e?.response?.data?.mensaje;

      if (msg) {
        setMensaje(<><span className="material-symbols-outlined">error</span> {msg}</>);
      } else if (e?.response?.status === 400) {
        setMensaje(<><span className="material-symbols-outlined">warning</span> Datos inválidos (revisa cantidad, tipo, producto).</>);
      } else if (e?.response?.status === 403) {
        setMensaje(<><span className="material-symbols-outlined">block</span> No tienes permisos para esta acción.</>);
      } else {
        setMensaje(<><span className="material-symbols-outlined">error</span> Error al registrar movimiento. Revisa el backend.</>);
      }
    }
  };

  const movimientosFiltrados = useMemo(() => {
    return movimientos.filter((m) => {
      const okTipo = filtroTipo === "todos" ? true : m.tipo === filtroTipo;
      const okProd = filtroProducto === "todos" ? true : m.id_producto === filtroProducto;
      return okTipo && okProd;
    });
  }, [movimientos, filtroTipo, filtroProducto]);

  return (
    <div className="card">
      <div className="seccion-header">
        <div className="seccion-header-info">
          <h1 className="ocultar-movil">Movimientos</h1>
          <div className="badge">
            <span className="material-symbols-outlined">receipt_long</span>
            <span>Entradas / Salidas / Ajustes</span>
            <span className="pill">{esSupervisor() ? "Solo lectura" : "Registro habilitado"}</span>
          </div>
        </div>

        <button className="btn-salir" onClick={volver}>
          Volver
        </button>
      </div>

      {/* FORMULARIO REGISTRO */}
      <div className="card-seccion">
        <p className="card-titulo">Registrar movimiento</p>

        <div className="form-grid">
          <select
            className="select full"
            value={idProducto}
            onChange={(e) => setIdProducto(Number(e.target.value))}
            disabled={!puedeRegistrar}
          >
            {productos.map((p) => (
              <option key={p.id_producto} value={p.id_producto}>
                {p.nombre}
              </option>
            ))}
          </select>

          <select
            className="select"
            value={tipo}
            onChange={(e) => setTipo(e.target.value as any)}
            disabled={!puedeRegistrar}
          >
            <option value="entrada">entrada</option>
            <option value="salida">salida</option>
            <option value="ajuste">ajuste</option>
          </select>

          <input
            className="input"
            type="number"
            value={cantidad}
            onChange={(e) => setCantidad(Number(e.target.value))}
            min={1}
            disabled={!puedeRegistrar}
            placeholder="Cantidad"
          />

          <div className="fila" style={{ justifyContent: "flex-end", marginBottom: 0, marginTop: 10 }}>
            <button className="btn-primario" onClick={registrarMovimiento} disabled={!puedeRegistrar}>
              <span className="material-symbols-outlined">add_circle</span> Registrar
            </button>
          </div>
        </div>

        {!puedeRegistrar && (
          <div className="mensaje info"><span className="material-symbols-outlined">info</span> Supervisor: solo puede visualizar.</div>
        )}
      </div>

      {/* FILTROS */}
      <div className="filtros">
        <select
          className="select"
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value as any)}
        >
          <option value="todos">Todos los tipos</option>
          <option value="entrada">Entradas</option>
          <option value="salida">Salidas</option>
          <option value="ajuste">Ajustes</option>
        </select>

        <select
          className="select"
          value={filtroProducto}
          onChange={(e) =>
            setFiltroProducto(e.target.value === "todos" ? "todos" : Number(e.target.value))
          }
        >
          <option value="todos">Todos los productos</option>
          {productos.map((p) => (
            <option key={p.id_producto} value={p.id_producto}>
              {p.nombre}
            </option>
          ))}
        </select>

        <div className="acciones">
          <button className="btn-secundario" onClick={cargarTodo}>
            <span className="material-symbols-outlined">refresh</span> Recargar
          </button>

          <button className="btn-secundario" onClick={abrirPdfKardex}>
            <span className="material-symbols-outlined">picture_as_pdf</span> PDF
          </button>
        </div>
      </div>

      {/* TABLA */}
      {cargando ? (
        <div className="loading">Cargando movimientos...</div>
      ) : (
        <div className="tabla-contenedor">
          <table className="tabla">
            <thead>
              <tr>
                <th style={{ width: 60 }}>Img</th>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Producto</th>
                <th>Cant.</th>
                <th className="ocultar-movil">Stock ant.</th>
                <th className="ocultar-movil">Stock act.</th>
                <th className="ocultar-movil">Usuario</th>
              </tr>
            </thead>
            <tbody>
              {movimientosFiltrados.map((m) => (
                <tr key={m.id_movimiento}>
                  <td>
                    {m.imagen ? (
                      <img
                        src={m.imagen}
                        alt={m.producto || String(m.id_producto)}
                        className="tabla-imagen"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="tabla-imagen-placeholder material-symbols-outlined">
                        package_2
                      </div>
                    )}
                  </td>
                  <td>{new Date(m.fecha).toLocaleDateString()}</td>
                  <td>
                    <span className={`pill ${m.tipo === 'entrada' ? 'exito' : m.tipo === 'salida' ? 'error' : ''}`}>
                      {m.tipo}
                    </span>
                  </td>
                  <td className="truncar" style={{ maxWidth: 150 }}>{m.producto || m.id_producto}</td>
                  <td>{m.cantidad}</td>
                  <td className="ocultar-movil">{m.stock_anterior}</td>
                  <td className="ocultar-movil">{m.stock_actual}</td>
                  <td className="ocultar-movil">{m.usuario || "-"}</td>
                </tr>
              ))}

              {movimientosFiltrados.length === 0 && (
                <tr>
                  <td colSpan={8} className="loading">
                    No hay movimientos para esos filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {mensaje && <div className="mensaje">{mensaje}</div>}
    </div>
  );
};

export default Movimientos;
