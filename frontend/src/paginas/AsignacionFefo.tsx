import { useEffect, useMemo, useState } from "react";
import api from "../api/api";
import { obtenerToken } from "../api/autenticacion";
import { esOperador, esAdmin } from "../contextos/sesion";
import "./AsignacionFefo.css";

type Producto = {
  id_producto: number;
  nombre: string;
  stock: number;
  activo: boolean;
  imagen?: string | null;
  categoria?: string;
  abv?: number;
  consume_early?: boolean;
};

type LoteAsignado = {
  id_lote: number;
  lote?: string | null;
  cantidad: number;
  fecha_caducidad?: string | null;
  fecha_apertura?: string | null;
  fecha_ingreso?: string | null;
};

const AsignacionFefo = ({ volver }: { volver?: () => void }) => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);
  const [lotesProducto, setLotesProducto] = useState<LoteAsignado[]>([]);
  const [cantidad, setCantidad] = useState<number>(1);
  const [asignaciones, setAsignaciones] = useState<Record<number, LoteAsignado[]>>({});
  const [mensaje, setMensaje] = useState<{ texto: string; tipo: 'exito' | 'error' | 'advertencia' } | null>(null);
  const [cargando, setCargando] = useState<boolean>(true);
  const [ubicacion, setUbicacion] = useState("");
  const [nota, setNota] = useState("");
  const [statusFresco, setStatusFresco] = useState("");
  const [statusAtencion, setStatusAtencion] = useState("");
  const [statusCritico, setStatusCritico] = useState("");

  const headers = useMemo(() => {
    const token = obtenerToken();
    return { Authorization: `Bearer ${token}` };
  }, []);

  useEffect(() => {
    const cargar = async () => {
      setCargando(true);
      try {
        const resp = await api.get("/productos", { headers });
        setProductos((resp.data.productos || []).filter((p: Producto) => p.activo));
      } catch (e) {
        console.error(e);
        setMensaje({ texto: "No se pudo cargar productos", tipo: 'error' });
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, [headers]);

  // Cargar lotes al seleccionar producto
  useEffect(() => {
    if (productoSeleccionado) {
      setUbicacion(""); // Dejar vacío para edición manual como pidió el usuario
      setNota("");      // Dejar vacío para edición manual como pidió el usuario

      const cargarLotes = async () => {
        try {
          const resp = await api.get(`/inventario/lotes/${productoSeleccionado.id_producto}`, { headers });
          if (resp.data.ok) {
            const lotes = resp.data.lotes;
            setLotesProducto(lotes);

            // Inicializar estados de status con los valores calculados
            const diasVence = lotes.length > 0 && lotes[0].fecha_caducidad
              ? `${calcularDiasParaVencer(lotes[0].fecha_caducidad)} días para vencer`
              : '180 días (estimado/sin fecha)';
            setStatusFresco(diasVence);

            const ingreso = `Entró ${lotes.length > 0 ? calcularTiempoIngreso(lotes[0].fecha_ingreso) : '---'}`;
            setStatusAtencion(ingreso);

            // Determinar salud para el status crítico inicial
            const diasList = lotes.map((l: any) => calcularDiasParaVencer(l.fecha_caducidad)).filter((d: any) => d !== null) as number[];
            const proximoVence = diasList.length > 0 ? Math.min(...diasList) : 999;
            const stockTotal = productoSeleccionado.stock;
            let critMsg = 'Sin alertas críticas detectadas';
            if (proximoVence < 15 || stockTotal < 10) {
              critMsg = stockTotal < 10 ? '¡STOCK BAJO!' : '¡VENCIMIENTO PRÓXIMO!';
            }
            setStatusCritico(critMsg);
          }
        } catch (e) {
          console.error("Error cargando lotes:", e);
        }
      };
      cargarLotes();
    } else {
      setLotesProducto([]);
      setStatusFresco("");
      setStatusAtencion("");
      setStatusCritico("");
    }
  }, [productoSeleccionado, headers]);

  const productosFiltrados = useMemo(() => {
    return productos.filter(p => p.nombre.toLowerCase().includes(busqueda.toLowerCase()));
  }, [productos, busqueda]);

  const asignarParaProducto = async () => {
    if (!productoSeleccionado) return;
    setMensaje(null);
    if (!esOperador()) {
      setMensaje({ texto: "Acceso restringido a Operadores.", tipo: 'error' });
      return;
    }

    if (!cantidad || cantidad <= 0) {
      setMensaje({ texto: "Ingresa una cantidad válida.", tipo: 'advertencia' });
      return;
    }

    try {
      const payload = {
        items: [{ id_producto: productoSeleccionado.id_producto, cantidad }],
        sucursalId: null
      };
      const resp = await api.post("/inventario/asignar-y-registrar", payload, { headers });

      if (resp?.data?.ok) {
        setAsignaciones((prev) => ({
          ...prev,
          [productoSeleccionado.id_producto]: resp.data.asignados[productoSeleccionado.id_producto] || []
        }));
        setMensaje({ texto: "¡Lotes asignados y registrados con éxito!", tipo: 'exito' });
        setCantidad(1);

        // Refrescar datos
        const respProd = await api.get("/productos", { headers });
        setProductos((respProd.data.productos || []).filter((p: Producto) => p.activo));
        const respLotes = await api.get(`/inventario/lotes/${productoSeleccionado.id_producto}`, { headers });
        if (respLotes.data.ok) setLotesProducto(respLotes.data.lotes);
      } else {
        setMensaje({ texto: resp?.data?.mensaje || 'Error en la asignación', tipo: 'error' });
      }
    } catch (e: any) {
      const msg = e?.response?.data?.mensaje || "Error al conectar con el servidor";
      setMensaje({ texto: msg, tipo: 'error' });
    }
  };

  // Simulación reactiva: Actualizar estados basado en la cantidad ajustada
  useEffect(() => {
    if (!productoSeleccionado || lotesProducto.length === 0) return;

    // Simular el picking siguiendo FEFO
    let cantidadRestante = cantidad;
    let siguienteLoteValido = null;

    // Ordenar lotes por FEFO (Caducidad desc, luego ingreso desc) para la simulación
    const lotesSimulados = [...lotesProducto].sort((a, b) => {
      if (a.fecha_caducidad && b.fecha_caducidad) {
        return new Date(a.fecha_caducidad).getTime() - new Date(b.fecha_caducidad).getTime();
      }
      return 0;
    });

    for (const lote of lotesSimulados) {
      if (cantidadRestante >= lote.cantidad) {
        cantidadRestante -= lote.cantidad;
      } else {
        siguienteLoteValido = lote;
        break;
      }
    }

    const loteReferencia = siguienteLoteValido || lotesSimulados[lotesSimulados.length - 1];

    setStatusFresco(loteReferencia.fecha_caducidad
      ? `${calcularDiasParaVencer(loteReferencia.fecha_caducidad)} días para vencer`
      : 'Sin fecha de caducidad');

    setStatusAtencion(`Entró ${calcularTiempoIngreso(loteReferencia.fecha_ingreso)}`);

    const stockResultante = productoSeleccionado.stock - cantidad;
    const diasList = lotesSimulados
      .filter(l => l !== siguienteLoteValido)
      .map(l => calcularDiasParaVencer(l.fecha_caducidad))
      .filter(d => d !== null) as number[];

    const proximoVence = diasList.length > 0 ? Math.min(...diasList) : 999;

    let critMsg = 'Sin alertas críticas detectadas';
    if (stockResultante < 10) critMsg = '¡STOCK RESULTANTE BAJO!';
    else if (proximoVence < 15) critMsg = '¡VENCIMIENTO PRÓXIMO EN SIGUIENTE LOTE!';

    setStatusCritico(critMsg);

  }, [cantidad, lotesProducto, productoSeleccionado]);

  const calcularDiasParaVencer = (fechaStr?: string | null) => {
    if (!fechaStr) return null;
    const fin = new Date(fechaStr);
    const hoy = new Date();
    const diff = fin.getTime() - hoy.getTime();
    return Math.ceil(diff / (1000 * 3600 * 24));
  };

  const calcularTiempoIngreso = (fechaStr?: string | null) => {
    if (!fechaStr) return null;
    const inicio = new Date(fechaStr);
    const hoy = new Date();
    const diff = hoy.getTime() - inicio.getTime();
    const semanas = Math.floor(diff / (1000 * 3600 * 24 * 7));
    if (semanas <= 0) return "esta semana";
    if (semanas === 1) return "hace 1 semana";
    return `hace ${semanas} semanas`;
  };

  const saludStock = useMemo(() => {
    if (!productoSeleccionado || lotesProducto.length === 0) return { dot: 'red', text: 'Sin Lotes' };

    const dias = lotesProducto.map(l => calcularDiasParaVencer(l.fecha_caducidad)).filter(d => d !== null) as number[];
    const proximoVence = dias.length > 0 ? Math.min(...dias) : 999;
    const stockTotal = productoSeleccionado.stock;

    if (proximoVence < 15 || stockTotal < 10) return { dot: 'red', text: 'CRÍTICO' };
    if (proximoVence < 60) return { dot: 'yellow', text: 'ATENCIÓN' };
    return { dot: 'green', text: 'ÓPTIMO' };
  }, [productoSeleccionado, lotesProducto]);

  return (
    <div className="asignacion-fefo-container">
      <div className="fefo-layout">
        {/* Sidebar: Buscador y Lista */}
        <div className="fefo-sidebar">
          <div className="buscador-panel">
            <div className="terminal-input-wrapper">
              <span className="search-icon-terminal material-symbols-outlined">search</span>
              <input
                type="text"
                className="terminal-input"
                placeholder="Escaneando productos..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
          </div>

          {cargando ? (
            <div style={{ padding: '2rem', textAlign: 'center', opacity: 0.5 }}>
              [ CARGANDO_DATOS... ]
            </div>
          ) : (
            <div className="productos-list">
              {productosFiltrados.map(p => (
                <div
                  key={p.id_producto}
                  className={`producto-item-terminal ${productoSeleccionado?.id_producto === p.id_producto ? 'active' : ''}`}
                  onClick={() => { setProductoSeleccionado(p); setMensaje(null); }}
                >
                  <div className="producto-info-mini">
                    <h4>{p.nombre}</h4>
                    <span>Stock total: {p.stock} u.</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="acciones-panel" style={{ marginTop: 'auto', paddingTop: '1rem' }}>
            <button className="btn-terminal-danger" style={{ width: '100%' }} onClick={volver}>
              VOLVER AL DASHBOARD
            </button>
          </div>
        </div>

        {/* Main: Content View */}
        <div className="fefo-main-panel">
          {productoSeleccionado ? (
            <div className="terminal-wrapper">
              <div className="terminal-dots">
                <div className="terminal-dot red"></div>
                <div className="terminal-dot yellow"></div>
                <div className="terminal-dot green"></div>
              </div>

              <div className="terminal-content">
                <div className="terminal-header-text">
                  <span className="material-symbols-outlined" style={{ verticalAlign: 'middle', marginRight: 4 }}>inventory_2</span> PRODUCTO: {productoSeleccionado.nombre}
                </div>

                <div className="terminal-ascii-box">
                  <div className="status-line">
                    <div className={`status-indicator green`}></div>
                    <span className="status-label green">Fresco:</span>
                    <input
                      type="text"
                      className="terminal-input"
                      style={{ background: 'transparent', border: 'none', color: 'var(--color-texto)', width: '100%', fontSize: 'var(--texto-sm)', padding: '0', marginLeft: '10px' }}
                      value={statusFresco}
                      onChange={(e) => setStatusFresco(e.target.value)}
                    />
                  </div>
                  <div className="status-line">
                    <div className={`status-indicator ${saludStock.dot === 'green' ? 'yellow' : saludStock.dot}`}></div>
                    <span className={`status-label ${saludStock.dot === 'green' ? 'yellow' : saludStock.dot}`}>Atención:</span>
                    <input
                      type="text"
                      className="terminal-input"
                      style={{ background: 'transparent', border: 'none', color: 'var(--color-texto)', width: '100%', fontSize: 'var(--texto-sm)', padding: '0', marginLeft: '10px' }}
                      value={statusAtencion}
                      onChange={(e) => setStatusAtencion(e.target.value)}
                    />
                  </div>
                  <div className="status-line">
                    <div className={`status-indicator ${saludStock.dot}`}></div>
                    <span className={`status-label ${saludStock.dot}`}>CRÍTICO:</span>
                    <input
                      type="text"
                      className="terminal-input"
                      style={{ background: 'transparent', border: 'none', color: 'var(--color-texto)', width: '100%', fontSize: 'var(--texto-sm)', padding: '0', marginLeft: '10px' }}
                      value={statusCritico}
                      onChange={(e) => setStatusCritico(e.target.value)}
                    />
                  </div>

                  <div className="terminal-divider"></div>

                  <div className="terminal-info-group">
                    <div className="info-item">
                      <span className="info-icon material-symbols-outlined">location_on</span>
                      <div className="info-text" style={{ width: '100%' }}>
                        <strong>Ubicación:</strong>
                        <input
                          type="text"
                          className="terminal-input"
                          style={{ background: 'var(--color-fondo-input)', border: '1px solid var(--color-borde)', borderRadius: 'var(--radio-sm)', color: 'var(--color-texto)', width: '100%', fontSize: 'var(--texto-sm)', marginTop: '4px' }}
                          placeholder="Ej: Estante B4..."
                          value={ubicacion}
                          onChange={(e) => setUbicacion(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="info-item">
                      <span className="info-icon material-symbols-outlined">edit_note</span>
                      <div className="info-text" style={{ width: '100%' }}>
                        <strong>Notas:</strong>
                        <textarea
                          className="terminal-input"
                          style={{ background: 'var(--color-fondo-input)', border: '1px solid var(--color-borde)', borderRadius: 'var(--radio-sm)', color: 'var(--color-texto-secundario)', width: '100%', fontSize: 'var(--texto-xs)', marginTop: '4px', resize: 'none', fontFamily: 'inherit' }}
                          placeholder="Notas adicionales..."
                          rows={2}
                          value={nota}
                          onChange={(e) => setNota(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="cart-selection-panel">
                  <div className="cart-header">
                    <h4>Asignar Cantidad</h4>
                    <div className="num-control">
                      <button className="btn-terminal-danger" onClick={() => setCantidad(prev => Math.max(1, prev - 1))}>-</button>
                      <span style={{ fontWeight: 700, minWidth: '30px', textAlign: 'center' }}>{cantidad}</span>
                      <button className="btn-terminal-danger" onClick={() => setCantidad(prev => prev + 1)}>+</button>
                    </div>
                  </div>

                  {mensaje && (
                    <div className={`mensaje ${mensaje.tipo}`} style={{ marginBottom: '1rem' }}>
                      {mensaje.texto}
                    </div>
                  )}

                  <button
                    className="btn-terminal-primary"
                    onClick={asignarParaProducto}
                  >
                    🚀 EJECUTAR ASIGNACIÓN FEFO
                  </button>
                </div>

                {asignaciones[productoSeleccionado.id_producto] && (
                  <div className="terminal-ascii-box" style={{ marginTop: '2rem', borderLeft: '4px solid var(--color-exito)', background: 'var(--color-exito-fondo)' }}>
                    <div style={{ color: 'var(--color-exito)', marginBottom: '1rem', fontWeight: 'bold' }}>✓ RESULTADO DE ASIGNACIÓN:</div>
                    {asignaciones[productoSeleccionado.id_producto].map((a, i) => (
                      <div key={i} className="info-item" style={{ marginBottom: '5px', fontSize: 'var(--texto-sm)' }}>
                        <span>»</span>
                        <span>[LOTE: {a.lote || `#${a.id_lote}`}] - CANTIDAD: {a.cantidad} u.</span>
                        {a.fecha_caducidad && <span style={{ color: 'var(--color-texto-muted)', marginLeft: '10px' }}>[Vence: {new Date(a.fecha_caducidad).toLocaleDateString()}]</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="terminal-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '500px' }}>
              <div className="terminal-content" style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 'var(--texto-lg)', color: 'var(--color-texto-muted)' }}>[ ESPERANDO SELECCIÓN DE PRODUCTO... ]</p>
                <div className="cursor-blink"></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AsignacionFefo;
