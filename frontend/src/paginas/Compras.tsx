import { Fragment, useEffect, useMemo, useState, useCallback } from "react";
import api from "../api/api";
import { obtenerToken } from "../api/autenticacion";
import "../estilos/dashboard.css";
import { esAdmin, esOperador, esSupervisor } from "../contextos/sesion";

type Proveedor = {
  id_proveedor: number;
  nombre: string;
  activo: boolean;
  producto?: string | null;
};

type Producto = {
  id_producto: number;
  nombre: string;
  stock: number;
  activo: boolean;
  imagen?: string | null;
};

type Compra = {
  id_compra: number;
  fecha: string;
  total: string;
  estado: string;
  proveedor: string;
  usuario: string;
};

type DetalleItem = {
  id_detalle: number;
  id_producto: number;
  nombre: string;
  cantidad: number;
  costo: string;
  subtotal: string;
  imagen?: string | null;
};

type CompraDetalle = {
  ok: boolean;
  cabecera: {
    id_compra: number;
    fecha: string;
    total: string;
    estado: string;
    id_proveedor: number;
    proveedor: string;
    id_usuario: number;
    usuario: string;
  };
  detalle: DetalleItem[];
};

type CarritoItem = {
  id_producto: number;
  nombre: string;
  cantidad: number;
  costo: number;
  subtotal: number;
  imagen?: string | null;
};

type LoteAsignado = {
  id_lote: number;
  lote?: string | null;
  cantidad: number;
  fecha_caducidad?: string | null;
  fecha_apertura?: string | null;
};

const money = (v: number) => v.toFixed(2);

const Compras = ({
  volver,
  embedded = false,
  selectedProveedorId = null,
}: {
  volver?: () => void;
  embedded?: boolean;
  selectedProveedorId?: number | null;
}) => {
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [compras, setCompras] = useState<Compra[]>([]);
  const [detalleCompra, setDetalleCompra] = useState<CompraDetalle | null>(null);

  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState<React.ReactNode>("");

  // formulario
  const [idProveedor, setIdProveedor] = useState<number>(0);
  const [proveedorQuery, setProveedorQuery] = useState<string>("");
  const [mostrarSugerenciasProv, setMostrarSugerenciasProv] = useState<boolean>(false);
  const [idProducto, setIdProducto] = useState<number>(0);
  const [cantidad, setCantidad] = useState<number>(1);
  const [costo, setCosto] = useState<number>(1);

  const [carrito, setCarrito] = useState<CarritoItem[]>([]);
  const [asignaciones, setAsignaciones] = useState<Record<number, Array<{ id_lote: number; lote?: string | null; cantidad: number; fecha_caducidad?: string | null; fecha_apertura?: string | null; }>>>({});

  const puedeRegistrar = esAdmin() || esOperador(); // Supervisor solo lectura

  const headers = useMemo(() => {
    const token = obtenerToken();
    return { Authorization: `Bearer ${token}` };
  }, []);

  const productosActivos = productos.filter((p) => p.activo);
  const proveedoresActivos = proveedores.filter((p) => p.activo);
  const sugerenciasProv = proveedoresActivos.filter((p) =>
    proveedorQuery.trim() ? p.nombre.toLowerCase().includes(proveedorQuery.toLowerCase()) : true
  );

  const totalCarrito = carrito.reduce((acc, it) => acc + it.subtotal, 0);

  const cargarTodo = useCallback(async () => {
    setCargando(true);
    setMensaje("");
    try {
      const [respProv, respProd, respComp] = await Promise.all([
        api.get("/proveedores", { headers }),
        api.get("/productos", { headers }),
        api.get("/compras", { headers }),
      ]);

      const listaProv: Proveedor[] = respProv.data.proveedores || [];
      const listaProd: Producto[] = respProd.data.productos || [];
      const listaComp: Compra[] = respComp.data.compras || [];

      setProveedores(listaProv);
      setProductos(listaProd);
      setCompras(listaComp);

      if (listaProv.length > 0) {
        setIdProveedor(listaProv[0].id_proveedor);
        setProveedorQuery(listaProv[0].nombre);
      }

      const activos = listaProd.filter((p) => p.activo);
      if (activos.length > 0) setIdProducto(activos[0].id_producto);
    } catch (e: any) {
      console.error("Error cargando compras:", e);

      if (e?.response?.data?.mensaje) {
        setMensaje(<><span className="material-symbols-outlined">error</span> {e.response.data.mensaje}</>);
      } else if (e?.response?.status === 401) {
        setMensaje(<><span className="material-symbols-outlined">error</span> Token inválido o expirado. Inicia sesión de nuevo.</>);
      } else if (e?.response?.status === 403) {
        setMensaje(<><span className="material-symbols-outlined">block</span> No tienes permisos para acceder a esta sección.</>);
      } else if (e?.message?.includes("Network Error")) {
        setMensaje(<><span className="material-symbols-outlined">error</span> Error de conexión. Verifica que el backend está corriendo.</>);
      } else {
        setMensaje(<><span className="material-symbols-outlined">error</span> Error al cargar proveedores/productos/compras. Revisa backend.</>);
      }
    } finally {
      setCargando(false);
    }
  }, [headers]);

  useEffect(() => {
    cargarTodo();
  }, [cargarTodo]);

  // Escuchar eventos para refrescar proveedores cuando se creen/editen desde otra página
  useEffect(() => {
    const handler = () => {
      cargarTodo();
    };
    window.addEventListener("refreshProveedores", handler as EventListener);
    return () => window.removeEventListener("refreshProveedores", handler as EventListener);
  }, [cargarTodo]);

  // Si el componente está embebido y recibe un proveedor seleccionado desde el padre,
  // sincronizamos la selección cuando carguen los proveedores
  useEffect(() => {
    if (selectedProveedorId && proveedores.length > 0) {
      const match = proveedores.find((p) => p.id_proveedor === selectedProveedorId);
      if (match) {
        setIdProveedor(match.id_proveedor);
        setProveedorQuery(match.nombre);
      }
    }
  }, [selectedProveedorId, proveedores]);

  const agregarAlCarrito = () => {
    setMensaje("");

    if (!puedeRegistrar) {
      setMensaje(<><span className="material-symbols-outlined">block</span> Supervisor no puede registrar compras.</>);
      return;
    }

    if (!idProveedor) return setMensaje(<><span className="material-symbols-outlined">warning</span> Selecciona un proveedor.</>);
    if (!idProducto) return setMensaje(<><span className="material-symbols-outlined">warning</span> Selecciona un producto.</>);
    if (!cantidad || cantidad <= 0) return setMensaje(<><span className="material-symbols-outlined">warning</span> Cantidad debe ser &gt; 0.</>);
    if (!costo || costo <= 0) return setMensaje(<><span className="material-symbols-outlined">warning</span> Costo debe ser &gt; 0.</>);

    const prod = productos.find((p) => p.id_producto === idProducto);
    if (!prod) return setMensaje(<><span className="material-symbols-outlined">warning</span> Producto no encontrado.</>);
    if (!prod.activo) return setMensaje(<><span className="material-symbols-outlined">warning</span> Producto inactivo.</>);

    setCarrito((prev) => {
      const idx = prev.findIndex((x) => x.id_producto === idProducto);
      if (idx >= 0) {
        const copia = [...prev];
        const nuevoCant = copia[idx].cantidad + cantidad;
        copia[idx] = {
          ...copia[idx],
          cantidad: nuevoCant,
          subtotal: nuevoCant * copia[idx].costo,
        };
        return copia;
      }

      return [
        ...prev,
        {
          id_producto: prod.id_producto,
          nombre: prod.nombre,
          cantidad,
          costo,
          subtotal: cantidad * costo,
          imagen: prod.imagen || null,
        },
      ];
    });

    setCantidad(1);
  };

  const quitarItem = (id_producto: number) => {
    setCarrito((prev) => prev.filter((x) => x.id_producto !== id_producto));
  };

  const asignarLotesParaItem = async (item: CarritoItem) => {
    setMensaje("");
    if (!esOperador()) {
      setMensaje(<><span className="material-symbols-outlined">block</span> Solo Operador puede usar la asignación automática en este apartado.</>);
      return;
    }

    try {
      const payload = { productoId: item.id_producto, sucursalId: null, cantidad: item.cantidad };
      const resp = await api.post("/inventario/asignar-lotes", payload, { headers });
      if (resp?.data?.ok) {
        const actuales = { ...(asignaciones || {}) };
        actuales[item.id_producto] = resp.data.asignados || [];
        setAsignaciones(actuales);
        setMensaje(<><span className="material-symbols-outlined">check_circle</span> Lotes asignados automáticamente (FEFO)</>);
      } else {
        setMensaje(<><span className="material-symbols-outlined">warning</span> {resp?.data?.mensaje || 'No se pudo asignar lotes.'}</>);
      }
    } catch (e: any) {
      const msg = e?.response?.data?.mensaje;
      if (e?.response?.status === 403) setMensaje(<><span className="material-symbols-outlined">block</span> No autorizado para asignar lotes.</>);
      else setMensaje(<><span className="material-symbols-outlined">error</span> Error al asignar lotes. {msg ? `(${msg})` : ''}</>);
    }
  };

  const vaciar = () => {
    setCarrito([]);
    setDetalleCompra(null);
    setMensaje("");
  };

  const confirmarCompra = async () => {
    setMensaje("");

    if (!puedeRegistrar) {
      setMensaje(<><span className="material-symbols-outlined">block</span> No tienes permisos para registrar compras.</>);
      return;
    }
    if (!idProveedor) {
      // intentar emparejar por texto si el usuario escribió el nombre
      const match = proveedoresActivos.find(
        (p) => p.nombre.toLowerCase() === proveedorQuery.trim().toLowerCase()
      );
      if (match) setIdProveedor(match.id_proveedor);
      else return setMensaje(<><span className="material-symbols-outlined">warning</span> Selecciona un proveedor.</>);
    }
    if (carrito.length === 0) return setMensaje(<><span className="material-symbols-outlined">warning</span> Agrega al menos un producto.</>);

    try {
      const payload = {
        id_proveedor: idProveedor,
        detalles: carrito.map((it) => ({
          id_producto: it.id_producto,
          cantidad: it.cantidad,
          costo: it.costo,
        })),
      };

      const resp = await api.post("/compras", payload, { headers });
      const idCompraCreada = resp?.data?.compra?.id_compra;

      setMensaje(<><span className="material-symbols-outlined">check_circle</span> Compra registrada</>);
      await cargarTodo();

      if (idCompraCreada) {
        const det = await api.get(`/compras/${idCompraCreada}`, { headers });
        setDetalleCompra(det.data);
      }

      setCarrito([]);
    } catch (e: any) {
      const msg = e?.response?.data?.mensaje;
      if (e?.response?.status === 400) setMensaje(<><span className="material-symbols-outlined">warning</span> {msg || "Datos inválidos."}</>);
      else if (e?.response?.status === 403) setMensaje(<><span className="material-symbols-outlined">block</span> No tienes permisos.</>);
      else setMensaje(<><span className="material-symbols-outlined">error</span> Error al registrar compra. {msg ? `(${msg})` : ""}</>);
    }
  };

  const verDetalle = async (id_compra: number) => {
    setMensaje("");
    try {
      const resp = await api.get(`/compras/${id_compra}`, { headers });
      setDetalleCompra(resp.data);
    } catch {
      setMensaje(<><span className="material-symbols-outlined">error</span> No se pudo cargar el detalle de la compra.</>);
    }
  };

  return (
    <>
      {!embedded && (
        <div className="card">
          <div className="topbar" style={{ marginBottom: 14 }}>
            <div>
              <h1 style={{ margin: 0 }}>Compras</h1>
              <div className="badge">
                <span className="material-symbols-outlined">package</span>
                <span>Registro y control de compras</span>
                <span className="pill">{esSupervisor() ? "Solo lectura" : "Registro habilitado"}</span>
              </div>
            </div>

            {volver && (
              <button className="btn-salir" onClick={volver}>
                Volver
              </button>
            )}
          </div>
        </div>
      )}

      {/* FORM */}
      <div className="card" style={{ marginBottom: 14 }}>
        <p className="card-titulo">Registrar compra</p>

        <div className="form-grid">
          <div style={{ position: "relative" }}>
            <input
              className="input full"
              placeholder="Buscar o seleccionar proveedor..."
              value={proveedorQuery}
              onChange={(e) => {
                setProveedorQuery(e.target.value);
                setIdProveedor(0);
                setMostrarSugerenciasProv(true);
              }}
              onFocus={() => setMostrarSugerenciasProv(true)}
              onBlur={() => setTimeout(() => setMostrarSugerenciasProv(false), 150)}
              disabled={!puedeRegistrar}
            />

            {mostrarSugerenciasProv && proveedoresActivos.length > 0 && (
              <div
                style={{
                  position: "absolute",
                  zIndex: 30,
                  left: 0,
                  right: 0,
                  background: "var(--color-fondo)",
                  border: "1px solid var(--color-borde)",
                  maxHeight: 200,
                  overflowY: "auto",
                }}
              >
                {sugerenciasProv.length > 0 ? (
                  sugerenciasProv.map((p) => (
                    <div
                      key={p.id_proveedor}
                      style={{ padding: 8, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                      onMouseDown={() => {
                        setIdProveedor(p.id_proveedor);
                        setProveedorQuery(p.nombre);
                        setMostrarSugerenciasProv(false);
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600 }}>{p.nombre}</div>
                        <div style={{ fontSize: 12, color: "var(--color-texto-muted)" }}>{p.producto || ""}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: 8, color: "var(--color-texto-muted)" }}>No hay proveedores</div>
                )}
              </div>
            )}
          </div>

          <div style={{ width: "100%", gridColumn: '1 / -1' }}>
            <div style={{ border: "1px solid var(--color-borde)", borderRadius: 8, padding: 12, background: "transparent" }}>
              <div style={{ fontSize: 12, color: "var(--color-texto-muted)", marginBottom: 8 }}>Productos</div>

              <select
                className="select full"
                value={idProducto}
                onChange={(e) => setIdProducto(Number(e.target.value))}
                disabled={!puedeRegistrar}
                style={{ marginBottom: 8 }}
              >
                {productosActivos.map((p) => (
                  <option key={p.id_producto} value={p.id_producto}>
                    {p.nombre} (stock: {p.stock})
                  </option>
                ))}
              </select>

              <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 8 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontSize: 12, color: "var(--color-texto-muted)", marginBottom: 6 }}>Cantidad</label>
                  <input
                    className="input"
                    type="number"
                    value={cantidad}
                    onChange={(e) => setCantidad(Number(e.target.value))}
                    min={1}
                    disabled={!puedeRegistrar}
                    placeholder="Cantidad"
                    style={{ padding: "12px 10px" }}
                  />
                </div>

                <div style={{ width: 180 }}>
                  <label style={{ display: "block", fontSize: 12, color: "var(--color-texto-muted)", marginBottom: 6 }}>Costo</label>
                  <input
                    className="input"
                    type="number"
                    value={costo}
                    onChange={(e) => setCosto(Number(e.target.value))}
                    min={0.01}
                    step={0.01}
                    disabled={!puedeRegistrar}
                    placeholder="Costo"
                    style={{ padding: "12px 10px" }}
                  />
                </div>
              </div>

              <div className="fila" style={{ justifyContent: "flex-start", gap: 10 }}>
                <button className="btn-secundario" onClick={agregarAlCarrito} disabled={!puedeRegistrar}>
                  Agregar productos
                </button>

                <button className="btn-primario" onClick={confirmarCompra} disabled={!puedeRegistrar}>
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="fila" style={{ justifyContent: "space-between", marginTop: 12 }}>
          <div className="badge">
            <span>Total:</span>
            <span className="pill">$ {money(totalCarrito)}</span>
          </div>

          <button className="btn-salir" onClick={vaciar}>
            Vaciar
          </button>
        </div>

        <table className="tabla" style={{ marginTop: 12 }}>
          <thead>
            <tr>
              <th style={{ width: 80 }}>Imagen</th>
              <th>Producto</th>
              <th>Cant.</th>
              <th>Costo</th>
              <th>Subtotal</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {carrito.map((it: CarritoItem) => (
              <Fragment key={it.id_producto}>
                <tr>
                  <td>
                    {it.imagen ? (
                      <img
                        src={it.imagen}
                        alt={it.nombre}
                        style={{
                          width: 50,
                          height: 50,
                          objectFit: "cover",
                          borderRadius: 4,
                          border: "1px solid #334155",
                        }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 50,
                          height: 50,
                          backgroundColor: "#1e293b",
                          borderRadius: 4,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#64748b",
                          fontSize: 20,
                        }}
                      >
                        <span className="material-symbols-outlined">inventory_2</span>
                      </div>
                    )}
                  </td>
                  <td>{it.nombre}</td>
                  <td>{it.cantidad}</td>
                  <td>$ {money(it.costo)}</td>
                  <td>$ {money(it.subtotal)}</td>
                  <td style={{ textAlign: "right" }}>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      {esOperador() && (
                        <button className="btn-secundario" onClick={() => asignarLotesParaItem(it)}>
                          Asignar lotes (FEFO)
                        </button>
                      )}

                      <button className="btn-salir" onClick={() => quitarItem(it.id_producto)}>
                        Quitar
                      </button>
                    </div>
                  </td>
                </tr>
                {asignaciones[it.id_producto] && asignaciones[it.id_producto].length > 0 && (
                  <tr>
                    <td colSpan={6} style={{ padding: 8, background: 'rgba(99,102,241,0.04)' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Lotes asignados (FEFO)</div>
                      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        {asignaciones[it.id_producto].map((a: LoteAsignado) => (
                          <div key={a.id_lote} style={{ border: '1px solid var(--color-borde)', padding: 8, borderRadius: 6, minWidth: 180 }}>
                            <div style={{ fontSize: 13, fontWeight: 700 }}>{a.lote || `Lote #${a.id_lote}`}</div>
                            <div style={{ fontSize: 12, color: 'var(--color-texto-muted)' }}>Cantidad: {a.cantidad}</div>
                            {a.fecha_caducidad && <div style={{ fontSize: 12 }}>Caduca: {new Date(a.fecha_caducidad).toLocaleDateString()}</div>}
                            {a.fecha_apertura && <div style={{ fontSize: 12 }}>Apertura: {new Date(a.fecha_apertura).toLocaleString()}</div>}
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}

            {carrito.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: 16, color: "#cbd5e1" }}>
                  No hay productos agregados.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {!puedeRegistrar && <div className="mensaje"><span className="material-symbols-outlined" style={{ verticalAlign: 'middle', marginRight: 4 }}>block</span> Supervisor: solo puede visualizar.</div>}
      </div>

      {/* LISTADO + DETALLE */}
      <div className="grid-dos">
        <div className="card">
          <p className="card-titulo">Listado</p>

          {cargando ? (
            <div className="loading">Cargando compras...</div>
          ) : (
            <table className="tabla">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Proveedor</th>
                  <th>Total</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {compras.map((c) => (
                  <tr key={c.id_compra}>
                    <td>{new Date(c.fecha).toLocaleString()}</td>
                    <td>{c.proveedor}</td>
                    <td>$ {Number(c.total).toFixed(2)}</td>
                    <td>
                      <span className="pill">{c.estado}</span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <button className="btn-salir" onClick={() => verDetalle(c.id_compra)}>
                        Ver
                      </button>
                    </td>
                  </tr>
                ))}

                {compras.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ padding: 16, color: "#cbd5e1" }}>
                      No hay compras registradas.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        <div className="card">
          <p className="card-titulo">Detalle</p>

          {!detalleCompra ? (
            <div className="loading">Selecciona una compra para ver el detalle.</div>
          ) : (
            <>
              <div className="badge" style={{ marginBottom: 12 }}>
                <span className="pill">Compra #{detalleCompra.cabecera.id_compra}</span>
                <span>
                  {detalleCompra.cabecera.proveedor} — $
                  {Number(detalleCompra.cabecera.total).toFixed(2)}
                </span>
                <span className="pill">{detalleCompra.cabecera.estado}</span>
              </div>

              <table className="tabla">
                <thead>
                  <tr>
                    <th style={{ width: 80 }}>Imagen</th>
                    <th>Producto</th>
                    <th>Cant.</th>
                    <th>Costo</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {detalleCompra.detalle.map((d) => (
                    <tr key={d.id_detalle}>
                      <td>
                        {d.imagen ? (
                          <img
                            src={d.imagen}
                            alt={d.nombre}
                            style={{
                              width: 60,
                              height: 60,
                              objectFit: "cover",
                              borderRadius: 4,
                              border: "1px solid #334155",
                            }}
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = "none";
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: 60,
                              height: 60,
                              backgroundColor: "#1e293b",
                              borderRadius: 4,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#64748b",
                              fontSize: 24,
                            }}
                          >
                            <span className="material-symbols-outlined">inventory_2</span>
                          </div>
                        )}
                      </td>
                      <td>{d.nombre}</td>
                      <td>{d.cantidad}</td>
                      <td>$ {Number(d.costo).toFixed(2)}</td>
                      <td>$ {Number(d.subtotal).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      </div>

      {mensaje && <div className="mensaje">{mensaje}</div>}
    </>
  );
};

export default Compras;
