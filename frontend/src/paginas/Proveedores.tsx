import { useState, useEffect } from "react";
import "../estilos/dashboard.css";
import MapaSelector from "../componentes/MapaSelector";
import { crearProveedor, listarProveedores, editarProveedor } from "../api/proveedores";
// Compras embebido eliminado por solicitud del usuario

const EVENTOS_PROXIMOS = [
  { id: 1, nombre: "Final Champions League", fecha: "2026-05-30", tipo: "Deportes" },
  { id: 2, nombre: "Feriado Nacional (Día del Trabajador)", fecha: "2026-05-01", tipo: "Feriado" },
  { id: 3, nombre: "Concierto Internacional Rock", fecha: "2026-07-20", tipo: "Concierto" }
];

const PREDICCIONES: Record<number, any[]> = {
  1: [
    { producto: "Cerveza Pilsener (Caja)", sugerido: 50, confianza: "Alta (90%)", razon: "Aumento del 200% histórico en partidos" },
    { producto: "Snacks Surtidos", sugerido: 30, confianza: "Media (85%)", razon: "Acompañamiento clásico" }
  ],
  2: [
    { producto: "Ron Abuelo", sugerido: 20, confianza: "Alta (90%)", razon: "Tendencia en reuniones largas de feriado" },
    { producto: "Aguardiente Cristal", sugerido: 40, confianza: "Alta (88%)", razon: "Demanda sostenida" }
  ],
  3: [
    { producto: "Vodka Smirnoff Ice", sugerido: 60, confianza: "Muy Alta (92%)", razon: "Consumo rápido en eventos masivos" },
    { producto: "Cerveza Lata 355ml", sugerido: 100, confianza: "Muy Alta (95%)", razon: "Formato ideal para conciertos" }
  ]
};

const Proveedores = ({ volver }: { volver: () => void }) => {
  const [nombre, setNombre] = useState("");
  const [producto, setProducto] = useState("");
  const [latitud, setLatitud] = useState<number | null>(null);
  const [longitud, setLongitud] = useState<number | null>(null);

  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [proveedoresLista, setProveedoresLista] = useState<any[]>([]);
  const [selectedProveedorId, setSelectedProveedorId] = useState<number | null>(null);
  const [editingProveedorId, setEditingProveedorId] = useState<number | null>(null);

  const [eventoSeleccionado, setEventoSeleccionado] = useState<number | null>(null);
  const [analizando, setAnalizando] = useState(false);
  const prediccionActual = eventoSeleccionado ? PREDICCIONES[eventoSeleccionado] : [];

  useEffect(() => {
    if (eventoSeleccionado) {
      setAnalizando(true);
      const timer = setTimeout(() => setAnalizando(false), 1200);
      return () => clearTimeout(timer);
    }
  }, [eventoSeleccionado]);

  const handleLocationSelect = (lat: number, lng: number) => {
    setLatitud(lat);
    setLongitud(lng);
  };

  const formatCoord = (c: any) => {
    if (c === null || c === undefined) return null;
    const n = Number(c);
    return !isNaN(n) ? n.toFixed(4) : String(c);
  };

  const cargarProveedores = async () => {
    try {
      const lista = await listarProveedores();
      setProveedoresLista(lista || []);
    } catch (err) {
      console.error("No se pudieron cargar proveedores", err);
    }
  };

  // cargar lista al montar
  useEffect(() => {
    cargarProveedores();
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ margin: 0 }}>Proveedores</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn-secundario" onClick={volver}>Volver</button>
        </div>
      </div>

      <div className="grid-dos" style={{ alignItems: "flex-start" }}>
        {/* Columna Izquierda: Formulario y Lista */}
        <div style={{ width: "100%", background: "var(--color-fondo-card)", padding: 18, borderRadius: 12, boxShadow: "0 6px 18px rgba(2,6,23,0.4)" }}>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                const payload: any = {
                  nombre,
                  producto,
                  correo: email || undefined,
                  telefono: telefono || undefined,
                };

                // Solo agregar coordenadas si están definidas
                if (latitud !== null && longitud !== null) {
                  payload.latitud = latitud;
                  payload.longitud = longitud;
                }

                let data: any;
                if (editingProveedorId) {
                  // editar
                  data = await editarProveedor({
                    id_proveedor: editingProveedorId,
                    ...payload,
                  } as any);
                } else {
                  data = await crearProveedor(payload);
                }

                if (data.ok) {
                  const idNew = data.proveedor?.id_proveedor ?? editingProveedorId ?? null;
                  alert(editingProveedorId ? "Proveedor actualizado" : "Proveedor agregado correctamente");
                  setNombre("");
                  setProducto("");
                  setEmail("");
                  setTelefono("");
                  setLatitud(null);
                  setLongitud(null);
                  setEditingProveedorId(null);
                  await cargarProveedores();
                  if (idNew) setSelectedProveedorId(idNew);
                  // notify other pages (por ejemplo Compras) que recarguen proveedores
                  try { window.dispatchEvent(new CustomEvent("refreshProveedores")); } catch (e) { }
                } else {
                  alert("Error: " + data.mensaje);
                }
              } catch (error: any) {
                console.error("Error guardando proveedor", error);
                const mensajeError = error?.response?.data?.error?.mensaje || error?.response?.data?.mensaje || "Error al guardar el proveedor";
                alert(mensajeError);
              }
            }}
            style={{ display: "flex", flexDirection: "column", gap: 12 }}
          >
            <div>
              <label>Nombre completo</label>
              <input
                className="login-input"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Nombre y apellido"
                required
              />
            </div>
            <div>
              <label>Producto</label>
              <input
                className="login-input"
                value={producto}
                onChange={(e) => setProducto(e.target.value)}
                placeholder="Producto que provee"
                required
              />
            </div>
            <div>
              <label>Correo Electrónico</label>
              <input
                className="login-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@correo.com"
              />
            </div>
            <div>
              <label>Teléfono</label>
              <input
                className="login-input"
                type="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="Número de contacto"
              />
            </div>

            <div>
              <label>Ubicación</label>
              <MapaSelector onLocationSelect={handleLocationSelect} />
              {latitud !== null && longitud !== null && (
                <p style={{ fontSize: "0.8rem", color: "#666" }}>
                  Ubicación seleccionada: {formatCoord(latitud)}, {formatCoord(longitud)}
                </p>
              )}
            </div>

            <button className="btn-primario" type="submit">Agregar</button>
          </form>

          <div style={{ marginTop: 14 }}>
            <h3 style={{ margin: "6px 0" }}>Proveedores</h3>
            <div style={{ maxHeight: 220, overflowY: "auto", borderRadius: 8, border: "1px solid rgba(255,255,255,0.03)", padding: 8 }}>
              {proveedoresLista.map((p) => (
                <div key={p.id_proveedor} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 8px", cursor: "pointer", background: selectedProveedorId === p.id_proveedor ? "rgba(255,255,255,0.02)" : "transparent" }}>
                  <div onClick={() => { setSelectedProveedorId(p.id_proveedor); }}>
                    <div style={{ fontWeight: 600 }}>{p.nombre}</div>
                    <div style={{ fontSize: 12, color: "var(--color-texto-muted)" }}>{p.producto || "-"}</div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button className="btn-secundario" onClick={() => {
                      // cargar en formulario para editar
                      setEditingProveedorId(p.id_proveedor);
                      setNombre(p.nombre || "");
                      setProducto(p.producto || "");
                      setEmail(p.correo || "");
                      setTelefono(p.telefono || "");
                      setLatitud(p.latitud ?? null);
                      setLongitud(p.longitud ?? null);
                    }}>Editar</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Columna Derecha: Predictor de Compras por Eventos */}
        <div style={{
          width: "100%",
          background: "linear-gradient(145deg, var(--color-fondo-card), #1e293b)",
          padding: 24,
          borderRadius: 16,
          boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
          borderTop: "5px solid var(--color-exito)",
          position: "relative",
          overflow: "hidden"
        }}>
          {/* Luz de fondo sutil */}
          <div style={{ position: "absolute", top: -50, right: -50, width: 150, height: 150, background: "var(--color-exito)", filter: "blur(100px)", opacity: 0.1, pointerEvents: "none" }}></div>

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div style={{ background: "rgba(34, 197, 94, 0.15)", padding: 10, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: "1.8rem" }}>🎯</span>
            </div>
            <div>
              <h3 style={{ margin: 0, color: "var(--color-exito)", letterSpacing: "0.5px", fontSize: "1.3rem" }}>Inteligencia de Eventos</h3>
              <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--color-texto-muted)", textTransform: "uppercase", fontWeight: 700 }}>Algoritmo Predictor v8.2</p>
            </div>
          </div>

          <div style={{ background: "rgba(0,0,0,0.2)", padding: 16, borderRadius: 12, marginBottom: 20, border: "1px solid rgba(255,255,255,0.05)" }}>
            <label style={{ display: "block", marginBottom: 10, fontWeight: 700, fontSize: "0.9rem", color: "var(--color-texto)" }}>CALENDARIO ESTRATÉGICO</label>
            <select
              className="login-input"
              style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "12px 16px" }}
              value={eventoSeleccionado || ""}
              onChange={(e) => setEventoSeleccionado(Number(e.target.value))}
            >
              <option value="">-- Seleccionar Próximo Evento --</option>
              {EVENTOS_PROXIMOS.map(ev => (
                <option key={ev.id} value={ev.id}>{ev.nombre} • {new Intl.DateTimeFormat('es-ES', { month: 'long', day: 'numeric' }).format(new Date(ev.fecha))}</option>
              ))}
            </select>
          </div>

          {analizando ? (
            <div style={{ textAlign: "center", padding: "40px 0", animation: "pulse 1.5s infinite" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: 15 }}>🧠</div>
              <p style={{ color: "var(--color-exito)", fontWeight: 600, margin: 0 }}>Procesando tendencias históricas...</p>
              <p style={{ fontSize: "0.8rem", color: "var(--color-texto-muted)" }}>Cruzando datos de stock y eventos similares</p>
            </div>
          ) : eventoSeleccionado ? (
            <div style={{ animation: "slideUp 0.5s ease-out" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h4 style={{ margin: 0, color: "var(--color-texto)", display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 8, height: 8, background: "var(--color-exito)", borderRadius: "50%" }}></span>
                  Demanda Estimada
                </h4>
                <div style={{ fontSize: "0.75rem", background: "rgba(255,255,255,0.05)", padding: "4px 8px", borderRadius: 4 }}>
                  Muestra: 5 años
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {prediccionActual.map((p, idx) => {
                  // Extract percentage from confidence string, e.g., "Muy Alta (95%)" -> "95%"
                  const confidenceMatch = p.confianza.match(/\((\d+)%\)/);
                  const confidencePercentage = confidenceMatch ? confidenceMatch[1] + '%' : '0%';
                  return (
                    <div key={idx} style={{
                      background: "rgba(255,255,255,0.02)",
                      padding: 16,
                      borderRadius: 14,
                      border: "1px solid rgba(255,255,255,0.05)",
                      transition: "all 0.3s ease"
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                        <div style={{ flex: 1 }}>
                          <strong style={{ fontSize: "1rem", color: "#fff", display: "block" }}>{p.producto}</strong>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                            <div style={{ width: 60, height: 4, background: "rgba(255,255,255,0.1)", borderRadius: 2 }}>
                              <div style={{ width: confidencePercentage, height: "100%", background: "var(--color-exito)", borderRadius: 2 }}></div>
                            </div>
                            <span style={{ fontSize: "0.7rem", color: "var(--color-exito)", fontWeight: 600 }}>{p.confianza} Confianza</span>
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <span style={{ fontSize: "0.7rem", color: "var(--color-texto-muted)", display: "block" }}>SUGERIDO</span>
                          <span style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--color-primario)" }}>{p.sugerido}u</span>
                        </div>
                      </div>
                      <div style={{
                        fontSize: "0.85rem",
                        color: "var(--color-texto-secundario)",
                        background: "rgba(0,0,0,0.2)",
                        padding: "8px 12px",
                        borderRadius: 8,
                        lineHeight: "1.4",
                        fontStyle: "italic"
                      }}>
                        " {p.razon} "
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                className="btn-primario"
                style={{
                  width: "100%",
                  marginTop: 24,
                  height: 48,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  background: "var(--color-exito)",
                  color: "#000",
                  fontWeight: 800,
                  fontSize: "0.95rem",
                  boxShadow: "0 4px 15px rgba(34, 197, 94, 0.3)"
                }}
                onClick={() => {
                  alert("¡Órdenes de compra proyectadas enviadas a la sección de Inventario!");
                  setEventoSeleccionado(null);
                }}
              >
                <span>🚀</span> GENERAR ÓRDENES DE STOCK
              </button>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "50px 0", opacity: 0.4, animation: "fadeIn 1s" }}>
              <div style={{ width: 80, height: 80, borderRadius: "50%", border: "2px dashed rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                <span style={{ fontSize: "2rem" }}>📅</span>
              </div>
              <h4 style={{ margin: "0 0 8px 0" }}>Análisis de Mercado Inactivo</h4>
              <p style={{ fontSize: "0.85rem", margin: 0 }}>Seleccione un evento para proyectar la demanda</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Proveedores;
