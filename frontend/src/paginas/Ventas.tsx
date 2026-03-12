import { useEffect, useMemo, useState, useCallback } from "react";
import api from "../api/api";
import { obtenerToken } from "../api/autenticacion";
import "../estilos/dashboard.css";
import "../estilos/movimientos.css";
import "../estilos/pos.css";
import { esAdmin, esOperador, esSupervisor } from "../contextos/sesion";
import {
  formatearDinero,
  validarStockDisponible,
  validarNombre
} from "../helpers/validaciones";
import ReconocimientoBotella from "../componentes/ReconocimientoBotella";

type Cliente = {
  id_cliente: number;
  nombre: string;
  cedula?: string | null;
  telefono?: string | null;
  correo?: string | null;
  direccion?: string | null;
  activo: boolean;
};

type CompraCliente = {
  id_venta: number;
  fecha: string;
  total: string;
  metodo_pago?: string;
  estado: string;
};

type Categoria = {
  id_categoria: number;
  nombre: string;
};

type Producto = {
  id_producto: number;
  nombre: string;
  precio: string;
  stock: number;
  activo: boolean;
  imagen?: string | null;
  categoria?: string;
  id_categoria?: number;
};

type Venta = {
  id_venta: number;
  fecha: string;
  total: string;
  estado: string;
  cliente: string;
  usuario: string;
  metodo_pago?: string;
};

type DetalleItem = {
  id_detalle: number;
  id_producto: number;
  nombre: string;
  cantidad: number;
  precio: string;
  subtotal: string;
  imagen?: string | null;
};

type VentaDetalle = {
  ok: boolean;
  cabecera: {
    id_venta: number;
    fecha: string;
    total: string;
    estado: string;
    id_cliente: number;
    cliente: string;
    id_usuario: number;
    usuario: string;
    metodo_pago?: string;
  };
  detalle: DetalleItem[];
};

type CarritoItem = {
  id_producto: number;
  nombre: string;
  cantidad: number;
  precio: number;
  subtotal: number;
  stock_disponible: number;
  imagen?: string | null;
};

type MetodoPago = "efectivo" | "transferencia" | "tarjeta";

const metodosPago: { valor: MetodoPago; etiqueta: string }[] = [
  { valor: "efectivo", etiqueta: "Efectivo" },
  { valor: "transferencia", etiqueta: "Transferencia" },
  { valor: "tarjeta", etiqueta: "Tarjeta" },
];

// Cliente por defecto para consumidor final
const CONSUMIDOR_FINAL = {
  id_cliente: 0,
  nombre: "Consumidor Final",
  activo: true,
};

const Ventas = ({ volver }: { volver: () => void }) => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [detalleVenta, setDetalleVenta] = useState<VentaDetalle | null>(null);
  const [comprasCliente, setComprasCliente] = useState<CompraCliente[]>([]);

  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState("");
  const [tipoMensaje, setTipoMensaje] = useState<"exito" | "error" | "advertencia">("error");
  const [procesando, setProcesando] = useState(false);

  // Formulario de venta
  const [idCliente, setIdCliente] = useState<number>(0);
  const [idProducto, setIdProducto] = useState<number>(0);
  const [metodoPago, setMetodoPago] = useState<MetodoPago>("efectivo");
  const [busquedaProducto, setBusquedaProducto] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState<number | "todas">("todas");

  // Carrito
  const [carrito, setCarrito] = useState<CarritoItem[]>([]);

  // Modal nuevo cliente
  const [mostrarNuevoCliente, setMostrarNuevoCliente] = useState(false);
  const [nuevoCliente, setNuevoCliente] = useState({ nombre: "", cedula: "", telefono: "" });

  // Reconocimiento IA
  const [mostrarReconocimiento, setMostrarReconocimiento] = useState(false);

  // Permisos
  const puedeRegistrar = esAdmin() || esOperador();
  const puedeAnular = esAdmin() || esSupervisor();
  const puedeRestaurar = esAdmin() || esSupervisor();

  const headers = useMemo(() => {
    const token = obtenerToken();
    return { Authorization: `Bearer ${token}` };
  }, []);

  // Productos activos filtrados
  const productosActivos = useMemo(() => {
    let lista = productos.filter((p) => p.activo && p.stock > 0);

    if (busquedaProducto.trim()) {
      const termino = busquedaProducto.toLowerCase();
      lista = lista.filter(p =>
        p.nombre.toLowerCase().includes(termino) ||
        (p.categoria || "").toLowerCase().includes(termino)
      );
    }

    if (filtroCategoria !== "todas") {
      lista = lista.filter(p => p.id_categoria?.toString() === filtroCategoria.toString());
    }

    return lista;
  }, [productos, busquedaProducto, filtroCategoria]);

  // Info del cliente seleccionado
  const clienteSeleccionado = useMemo(() => {
    return clientes.find(c => c.id_cliente === idCliente) || null;
  }, [clientes, idCliente]);

  // Estadísticas del cliente
  const estadisticasCliente = useMemo(() => {
    if (!comprasCliente || comprasCliente.length === 0) {
      return {
        totalGastado: 0,
        numeroCompras: 0,
        ultimaCompra: null,
        promedioPorCompra: 0,
      };
    }

    const totalGastado = comprasCliente.reduce((acc, c) => acc + Number(c.total), 0);
    const numeroCompras = comprasCliente.length;
    const ultimaCompra = comprasCliente[0]?.fecha;
    const promedioPorCompra = totalGastado / numeroCompras;

    return {
      totalGastado,
      numeroCompras,
      ultimaCompra,
      promedioPorCompra,
    };
  }, [comprasCliente]);

  // Total del carrito
  const totalCarrito = useMemo(
    () => carrito.reduce((acc, it) => acc + it.subtotal, 0),
    [carrito]
  );

  // Mostrar mensaje
  const mostrarMensajeUI = (texto: string, tipo: "exito" | "error" | "advertencia") => {
    setMensaje(texto);
    setTipoMensaje(tipo);
    if (tipo === "exito") {
      setTimeout(() => setMensaje(""), 4000);
    }
  };

  // Cargar historial de compras del cliente
  const cargarComprasCliente = useCallback(async (id: number) => {
    if (id === 0) {
      setComprasCliente([]);
      return;
    }

    try {
      const resp = await api.get(`/clientes/${id}/compras`, { headers });
      setComprasCliente(resp.data.compras || []);
    } catch {
      setComprasCliente([]);
    }
  }, [headers]);

  // Cargar datos
  const cargarTodo = useCallback(async () => {
    setCargando(true);
    setMensaje("");
    try {
      const [respCli, respProd, respVen, respCat] = await Promise.all([
        api.get("/clientes", { headers }),
        api.get("/productos", { headers }),
        api.get("/ventas", { headers }),
        api.get("/categorias", { headers }),
      ]);

      const listaCli: Cliente[] = respCli.data.clientes || [];
      const listaProd: Producto[] = respProd.data.productos || [];
      const listaVen: Venta[] = respVen.data.ventas || [];
      const listaCat: Categoria[] = respCat.data.categorias || [];

      // Agregar consumidor final a la lista
      setClientes([CONSUMIDOR_FINAL, ...listaCli.filter((c) => c.activo)]);
      setProductos(listaProd);
      setVentas(listaVen);
      setCategorias(listaCat);

      // Seleccionar primer producto disponible
      const activos = listaProd.filter((p) => p.activo && p.stock > 0);
      if (activos.length > 0) setIdProducto(activos[0].id_producto);

    } catch {
      mostrarMensajeUI("No se pudieron cargar los datos. Verifica la conexión.", "error");
    } finally {
      setCargando(false);
    }
  }, [headers]);

  useEffect(() => {
    cargarTodo();
  }, [cargarTodo]);

  // Cargar compras cuando cambia el cliente
  useEffect(() => {
    cargarComprasCliente(idCliente);
  }, [idCliente, cargarComprasCliente]);


  const seleccionarYAgregar = (id: number) => {
    // Esta función selecciona un producto y lo agrega con cantidad 1 inmediatamente
    const prod = productos.find(p => p.id_producto === id);
    if (!prod) return;

    // Usamos el estado actual si ya estaba seleccionado o seleccionamos este
    setIdProducto(id);

    // Necesitamos pasar la info directamente porque el set state es asíncrono
    const enCarrito = carrito.find(x => x.id_producto === id);
    const cantidadEnCarrito = enCarrito ? enCarrito.cantidad : 0;
    const cantidadTotal = cantidadEnCarrito + 1;

    const validacionStock = validarStockDisponible(prod.stock, cantidadTotal);
    if (!validacionStock.valido) {
      mostrarMensajeUI(validacionStock.mensaje!, "advertencia");
      return;
    }

    const precioNum = Number(prod.precio);
    setCarrito((prev) => {
      const idx = prev.findIndex((x) => x.id_producto === id);
      if (idx >= 0) {
        const copia = [...prev];
        copia[idx] = { ...copia[idx], cantidad: cantidadTotal, subtotal: cantidadTotal * precioNum };
        return copia;
      }
      return [...prev, {
        id_producto: id,
        nombre: prod.nombre,
        cantidad: 1,
        precio: precioNum,
        subtotal: precioNum,
        stock_disponible: prod.stock,
        imagen: prod.imagen || null,
      }];
    });
    mostrarMensajeUI(`${prod.nombre} +1`, "exito");
  };

  // Modificar cantidad en carrito
  const modificarCantidadCarrito = (id_producto: number, nuevaCantidad: number) => {
    const item = carrito.find(x => x.id_producto === id_producto);
    if (!item) return;

    if (nuevaCantidad <= 0) {
      quitarItem(id_producto);
      return;
    }

    const validacionStock = validarStockDisponible(item.stock_disponible, nuevaCantidad);
    if (!validacionStock.valido) {
      mostrarMensajeUI(validacionStock.mensaje!, "advertencia");
      return;
    }

    setCarrito((prev) =>
      prev.map((x) =>
        x.id_producto === id_producto
          ? { ...x, cantidad: nuevaCantidad, subtotal: nuevaCantidad * x.precio }
          : x
      )
    );
  };

  // Quitar item del carrito
  const quitarItem = (id_producto: number) => {
    setCarrito((prev) => prev.filter((x) => x.id_producto !== id_producto));
  };

  // Vaciar carrito
  const vaciar = () => {
    setCarrito([]);
    setDetalleVenta(null);
    setMensaje("");
    setIdCliente(0);
  };

  // Confirmar venta
  const confirmarVenta = async () => {
    setMensaje("");

    if (!puedeRegistrar) {
      mostrarMensajeUI("No tienes permisos para registrar ventas", "error");
      return;
    }

    if (carrito.length === 0) {
      mostrarMensajeUI("Agrega al menos un producto al carrito", "advertencia");
      return;
    }

    setProcesando(true);

    try {
      const payload = {
        id_cliente: idCliente || null, // null para consumidor final
        metodo_pago: metodoPago,
        detalles: carrito.map((it) => ({
          id_producto: it.id_producto,
          cantidad: it.cantidad,
          precio: it.precio,
        })),
      };

      const resp = await api.post("/ventas", payload, { headers });
      const idVentaCreada = resp?.data?.venta?.id_venta;

      mostrarMensajeUI("Venta registrada exitosamente", "exito");

      // Refrescar datos
      await cargarTodo();

      // Mostrar detalle de la venta
      if (idVentaCreada) {
        const det = await api.get(`/ventas/${idVentaCreada}`, { headers });
        setDetalleVenta(det.data);
      }

      setCarrito([]);
      setIdCliente(0);
      setMetodoPago("efectivo");

    } catch (error: any) {
      const msg = error?.response?.data?.mensaje;
      if (error?.response?.status === 400) {
        mostrarMensajeUI(msg || "Datos inválidos o stock insuficiente", "error");
      } else if (error?.response?.status === 403) {
        mostrarMensajeUI("No tienes permisos para esta acción", "error");
      } else {
        mostrarMensajeUI(`Error al registrar venta. ${msg || ""}`, "error");
      }
    } finally {
      setProcesando(false);
    }
  };

  // Ver detalle de venta
  const verDetalle = async (id_venta: number) => {
    setMensaje("");
    try {
      const resp = await api.get(`/ventas/${id_venta}`, { headers });
      setDetalleVenta(resp.data);
    } catch {
      mostrarMensajeUI("No se pudo cargar el detalle de la venta", "error");
    }
  };

  // Abrir PDF
  const abrirPdf = (id_venta: number) => {
    const token = obtenerToken();
    const url = `http://localhost:3000/api/reportes/ventas/${id_venta}/pdf?token=${token}`;
    window.open(url, "_blank");
  };

  // Anular venta
  const anularVenta = async (id_venta: number) => {
    if (!puedeAnular) {
      mostrarMensajeUI("Solo Administrador o Supervisor pueden anular ventas", "error");
      return;
    }

    const motivo = window.prompt("Ingresa el motivo de la anulación (obligatorio):");
    if (!motivo || !motivo.trim()) {
      mostrarMensajeUI("Debes ingresar un motivo para anular", "advertencia");
      return;
    }

    try {
      await api.patch(`/ventas/${id_venta}/anular`, { motivo: motivo.trim() }, { headers });
      mostrarMensajeUI("Venta anulada correctamente. Stock revertido.", "exito");
      await cargarTodo();
      setDetalleVenta(null);
    } catch (error: any) {
      const msg = error?.response?.data?.mensaje || "Error al anular la venta";
      mostrarMensajeUI(msg, "error");
    }
  };

  // Restaurar venta
  const restaurarVenta = async (id_venta: number) => {
    if (!puedeRestaurar) {
      mostrarMensajeUI("Solo Administrador o Supervisor pueden restaurar ventas", "error");
      return;
    }

    if (!window.confirm("¿Estás seguro que deseas restaurar esta venta? Esto volverá a descontar el stock.")) return;

    setProcesando(true);
    try {
      await api.patch(`/ventas/${id_venta}/restaurar`, {}, { headers });
      mostrarMensajeUI("Venta restaurada correctamente.", "exito");
      await cargarTodo();
      setDetalleVenta(null);
    } catch (error: any) {
      const msg = error?.response?.data?.mensaje || "Error al restaurar la venta";
      mostrarMensajeUI(msg, "error");
    } finally {
      setProcesando(false);
    }
  };

  // Crear nuevo cliente rápido
  const crearClienteRapido = async () => {
    const validacion = validarNombre(nuevoCliente.nombre, 2, 150);
    if (!validacion.valido) {
      mostrarMensajeUI(validacion.mensaje!, "advertencia");
      return;
    }

    try {
      const resp = await api.post("/clientes", {
        nombre: nuevoCliente.nombre.trim(),
        cedula: nuevoCliente.cedula.trim() || null,
        telefono: nuevoCliente.telefono.trim() || null,
      }, { headers });

      const nuevoId = resp.data.cliente?.id_cliente;

      await cargarTodo();

      if (nuevoId) {
        setIdCliente(nuevoId);
      }

      setMostrarNuevoCliente(false);
      setNuevoCliente({ nombre: "", cedula: "", telefono: "" });
      mostrarMensajeUI("Cliente creado y seleccionado", "exito");
    } catch (error: any) {
      const msg = error?.response?.data?.mensaje || "Error al crear cliente";
      mostrarMensajeUI(msg, "error");
    }
  };

  return (
    <div className="card">
      {/* Header */}
      <div className="seccion-header">
        <div className="seccion-header-info">
          <h1>Ventas</h1>
          <div className="badge">
            <span>�</span>
            <span>Atención al Cliente - POS</span>
            <span className={`pill ${esSupervisor() ? "advertencia" : "primario"}`}>
              {esSupervisor() ? "Solo lectura" : "Terminal Activa"}
            </span>
          </div>
        </div>
        <button className="btn-salir" onClick={volver}>
          ← Salir
        </button>
      </div>

      {/* Formulario de venta */}
      {puedeRegistrar && (
        <div className="card-seccion" style={{ marginBottom: "var(--espaciado-xl)" }}>
          {/* Info del Cliente Seleccionado */}
          {clienteSeleccionado && idCliente !== 0 && (
            <div style={{
              background: "linear-gradient(135deg, var(--color-primario), var(--color-primario-oscuro))",
              borderRadius: "var(--radio-md)",
              padding: "var(--espaciado-lg)",
              marginBottom: "var(--espaciado-lg)",
              color: "white"
            }}>
              <div className="grid-dos" style={{ gap: "var(--espaciado-lg)" }}>
                {/* Datos del cliente */}
                <div>
                  <p style={{ fontSize: "var(--texto-sm)", opacity: 0.8, marginBottom: "var(--espaciado-xs)" }}>CLIENTE SELECCIONADO</p>
                  <h3 style={{ margin: "var(--espaciado-xs) 0", fontSize: "var(--texto-xl)" }}>
                    {clienteSeleccionado.nombre}
                  </h3>
                  <div style={{ fontSize: "var(--texto-sm)", opacity: 0.9, lineHeight: 1.6 }}>
                    {clienteSeleccionado.cedula && <div><span className="material-symbols-outlined" style={{ fontSize: '1rem', verticalAlign: 'middle', marginRight: 4 }}>badge</span> Cédula: {clienteSeleccionado.cedula}</div>}
                    {clienteSeleccionado.telefono && <div><span className="material-symbols-outlined" style={{ fontSize: '1rem', verticalAlign: 'middle', marginRight: 4 }}>smartphone</span> Teléfono: {clienteSeleccionado.telefono}</div>}
                    {clienteSeleccionado.correo && <div><span className="material-symbols-outlined" style={{ fontSize: '1rem', verticalAlign: 'middle', marginRight: 4 }}>mail</span> Correo: {clienteSeleccionado.correo}</div>}
                    {clienteSeleccionado.direccion && <div><span className="material-symbols-outlined" style={{ fontSize: '1rem', verticalAlign: 'middle', marginRight: 4 }}>location_on</span> Dirección: {clienteSeleccionado.direccion}</div>}
                  </div>
                </div>

                {/* Estadísticas */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "var(--espaciado-md)" }}>
                  <div style={{ background: "rgba(255,255,255,0.1)", padding: "var(--espaciado-md)", borderRadius: "var(--radio-sm)" }}>
                    <div style={{ fontSize: "var(--texto-xs)", opacity: 0.8, marginBottom: "var(--espaciado-xs)" }}>Total Gastado</div>
                    <div style={{ fontSize: "var(--texto-lg)", fontWeight: 700 }}>
                      ${formatearDinero(estadisticasCliente.totalGastado)}
                    </div>
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.1)", padding: "var(--espaciado-md)", borderRadius: "var(--radio-sm)" }}>
                    <div style={{ fontSize: "var(--texto-xs)", opacity: 0.8, marginBottom: "var(--espaciado-xs)" }}>Compras</div>
                    <div style={{ fontSize: "var(--texto-lg)", fontWeight: 700 }}>
                      {estadisticasCliente.numeroCompras}
                    </div>
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.1)", padding: "var(--espaciado-md)", borderRadius: "var(--radio-sm)" }}>
                    <div style={{ fontSize: "var(--texto-xs)", opacity: 0.8, marginBottom: "var(--espaciado-xs)" }}>Promedio</div>
                    <div style={{ fontSize: "var(--texto-lg)", fontWeight: 700 }}>
                      ${formatearDinero(estadisticasCliente.promedioPorCompra)}
                    </div>
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.1)", padding: "var(--espaciado-md)", borderRadius: "var(--radio-sm)" }}>
                    <div style={{ fontSize: "var(--texto-xs)", opacity: 0.8, marginBottom: "var(--espaciado-xs)" }}>Última Compra</div>
                    <div style={{ fontSize: "var(--texto-sm)", fontWeight: 700 }}>
                      {estadisticasCliente.ultimaCompra
                        ? new Date(estadisticasCliente.ultimaCompra).toLocaleDateString()
                        : "Sin compras"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Historial de últimas compras */}
              {comprasCliente.length > 0 && (
                <div style={{ marginTop: "var(--espaciado-lg)", borderTop: "1px solid rgba(255,255,255,0.2)", paddingTop: "var(--espaciado-lg)" }}>
                  <p style={{ fontSize: "var(--texto-sm)", opacity: 0.8, marginBottom: "var(--espaciado-md)" }}>ÚLTIMAS 5 COMPRAS</p>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "var(--espaciado-sm)" }}>
                    {comprasCliente.slice(0, 5).map((compra, idx) => (
                      <div key={idx} style={{
                        background: "rgba(255,255,255,0.1)",
                        padding: "var(--espaciado-sm)",
                        borderRadius: "var(--radio-sm)",
                        fontSize: "var(--texto-xs)"
                      }}>
                        <div style={{ opacity: 0.8 }}>{new Date(compra.fecha).toLocaleDateString()}</div>
                        <div style={{ fontWeight: 700, fontSize: "var(--texto-sm)", marginTop: 4 }}>
                          ${formatearDinero(compra.total)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {idCliente === 0 && (
            <div style={{
              background: "rgba(255,193,7,0.1)",
              border: "1px solid rgba(255,193,7,0.3)",
              borderRadius: "var(--radio-md)",
              padding: "var(--espaciado-lg)",
              marginBottom: "var(--espaciado-lg)",
              textAlign: "center",
              color: "var(--color-advertencia)"
            }}>
              <span><span className="material-symbols-outlined" style={{ verticalAlign: 'middle', marginRight: 8 }}>person</span> Selecciona o crea un cliente para ver su historial</span>
            </div>
          )}
          <div className="form-grid" style={{ gridTemplateColumns: "1fr" }}>
            {/* Cliente y Pago en una fila */}
            <div className="grid-igual">
              <div className="campo">
                <label className="label">Cliente</label>
                <div style={{ display: "flex", gap: "var(--espaciado-sm)" }}>
                  <select
                    className="select"
                    style={{ flex: 1 }}
                    value={idCliente}
                    onChange={(e) => setIdCliente(Number(e.target.value))}
                  >
                    {clientes.map((c) => (
                      <option key={c.id_cliente} value={c.id_cliente}>
                        {c.nombre} {c.cedula ? `(${c.cedula})` : ""}
                      </option>
                    ))}
                  </select>
                  <button
                    className="btn-secundario"
                    onClick={() => setMostrarNuevoCliente(true)}
                    title="Crear nuevo cliente"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="campo">
                <label className="label">Método de pago</label>
                <select
                  className="select"
                  value={metodoPago}
                  onChange={(e) => setMetodoPago(e.target.value as MetodoPago)}
                >
                  {metodosPago.map((m) => (
                    <option key={m.valor} value={m.valor}>
                      {m.etiqueta}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* BUSCADOR Y CATEGORÍAS POS */}
            <div className="campo full" style={{ marginBottom: 0 }}>
              <div className="fila-entre">
                <label className="label">Seleccionar Productos</label>
                <div className="pos-categorias">
                  <button
                    className={`pos-categoria-btn ${filtroCategoria === "todas" ? "activo" : ""}`}
                    onClick={() => setFiltroCategoria("todas")}
                  >
                    Todo
                  </button>
                  {categorias.map(cat => (
                    <button
                      key={cat.id_categoria}
                      className={`pos-categoria-btn ${filtroCategoria === cat.id_categoria ? "activo" : ""}`}
                      onClick={() => setFiltroCategoria(cat.id_categoria)}
                    >
                      {cat.nombre}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 'var(--espaciado-sm)', marginBottom: 'var(--espaciado-sm)' }}>
                <input
                  className="input"
                  style={{ marginBottom: 0, flex: 1 }}
                  placeholder="Buscar licor, cerveza, vino..."
                  value={busquedaProducto}
                  onChange={(e) => setBusquedaProducto(e.target.value)}
                />
                <button
                  className="btn-secundario"
                  onClick={() => setMostrarReconocimiento(true)}
                  title="Reconocimiento por Foto IA"
                  style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
                >
                  <span className="material-symbols-outlined">photo_camera</span> IA
                </button>
              </div>

              <div className="pos-grid">
                {productosActivos.map(p => (
                  <div
                    key={p.id_producto}
                    className={`pos-card ${idProducto === p.id_producto ? 'activo' : ''}`}
                    onClick={() => seleccionarYAgregar(p.id_producto)}
                  >
                    {p.imagen ? (
                      <img src={p.imagen} alt={p.nombre} className="pos-card-img" />
                    ) : (
                      <div className="tabla-imagen-placeholder pos-card-img material-symbols-outlined">liquor</div>
                    )}
                    <div className="pos-card-info">
                      <div className="pos-card-nombre">{p.nombre}</div>
                      <div className="pos-card-precio">${formatearDinero(p.precio)}</div>
                      <div className={`pos-card-stock ${p.stock <= 5 ? 'bajo' : ''}`}>
                        Stock: {p.stock}
                      </div>
                    </div>
                  </div>
                ))}
                {productosActivos.length === 0 && (
                  <div className="full loading">No se encontraron productos</div>
                )}
              </div>
            </div>
          </div>

          {/* Carrito PREMIUM */}
          <div style={{ marginTop: "var(--espaciado-xl)" }}>
            <div className="fila-entre" style={{ marginBottom: "var(--espaciado-sm)" }}>
              <span style={{ fontSize: "var(--texto-lg)", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
                <span className="material-symbols-outlined">shopping_cart</span> Carrito de Compra
              </span>
              <div className="badge">
                <span style={{ fontWeight: 600 }}>Total a Pagar:</span>
                <span className="pill primario" style={{ fontSize: "var(--texto-xl)", padding: "8px 16px" }}>
                  $ {formatearDinero(totalCarrito)}
                </span>
              </div>
            </div>

            <div className="tabla-contenedor carrito-premium" style={{ borderRadius: "var(--radio-lg)", border: "1px solid var(--color-borde)" }}>
              <table className="tabla tabla-sm">
                <thead>
                  <tr>
                    <th style={{ width: 60 }}>Img</th>
                    <th>Producto</th>
                    <th>Precio</th>
                    <th>Cantidad</th>
                    <th>Subtotal</th>
                    <th style={{ width: 80 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {carrito.map((item) => (
                    <tr key={item.id_producto}>
                      <td>
                        {item.imagen ? (
                          <img
                            src={item.imagen}
                            alt={item.nombre}
                            className="tabla-imagen"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="tabla-imagen-placeholder material-symbols-outlined">package</div>
                        )}
                      </td>
                      <td style={{ fontWeight: 500 }}>{item.nombre}</td>
                      <td>$ {formatearDinero(item.precio)}</td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "var(--espaciado-xs)" }}>
                          <button
                            className="btn-secundario btn-sm"
                            onClick={() => modificarCantidadCarrito(item.id_producto, item.cantidad - 1)}
                          >
                            -
                          </button>
                          <span style={{ minWidth: 30, textAlign: "center" }}>{item.cantidad}</span>
                          <button
                            className="btn-secundario btn-sm"
                            onClick={() => modificarCantidadCarrito(item.id_producto, item.cantidad + 1)}
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td style={{ fontWeight: 600 }}>$ {formatearDinero(item.subtotal)}</td>
                      <td>
                        <button
                          className="btn-peligro btn-sm"
                          onClick={() => quitarItem(item.id_producto)}
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                  {carrito.length === 0 && (
                    <tr>
                      <td colSpan={6} className="loading">
                        No hay productos en el carrito
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="fila" style={{ marginTop: "var(--espaciado-md)", justifyContent: "flex-end" }}>
              <button className="btn-secundario" onClick={vaciar} disabled={carrito.length === 0}>
                Vaciar carrito
              </button>
              <button
                className="btn-primario"
                onClick={confirmarVenta}
                disabled={procesando || carrito.length === 0}
              >
                {procesando ? "Procesando..." : `Confirmar Venta ($${formatearDinero(totalCarrito)})`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mensaje */}
      {mensaje && (
        <div className={`mensaje ${tipoMensaje}`} style={{ marginBottom: "var(--espaciado-md)" }}>
          {mensaje}
        </div>
      )}

      {/* Grid de listado y detalle */}
      <div className="grid-dos">
        {/* Listado de ventas */}
        <div className="card">
          <p className="card-titulo">Historial de Ventas</p>

          {cargando ? (
            <div className="loading">
              <div className="loading-spinner"></div>
              Cargando ventas...
            </div>
          ) : (
            <div className="tabla-contenedor">
              <table className="tabla">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Cliente</th>
                    <th>Total</th>
                    <th>Estado</th>
                    <th style={{ width: 120 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {ventas.map((v) => (
                    <tr key={v.id_venta}>
                      <td>{new Date(v.fecha).toLocaleDateString()}</td>
                      <td className="truncar" style={{ maxWidth: 120 }}>{v.cliente}</td>
                      <td style={{ fontWeight: 600 }}>$ {formatearDinero(v.total)}</td>
                      <td>
                        <span className={`pill ${v.estado === "registrada" ? "exito" : v.estado === "anulada" ? "error" : ""}`}>
                          {v.estado}
                        </span>
                      </td>
                      <td>
                        <div className="acciones">
                          <button
                            className="btn-secundario btn-sm"
                            onClick={() => verDetalle(v.id_venta)}
                          >
                            Ver
                          </button>
                          <button
                            className="btn-secundario btn-sm"
                            onClick={() => abrirPdf(v.id_venta)}
                          >
                            PDF
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {ventas.length === 0 && (
                    <tr>
                      <td colSpan={5} className="loading">
                        No hay ventas registradas
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Detalle de venta */}
        <div className="card">
          <p className="card-titulo">Detalle de Venta</p>

          {!detalleVenta ? (
            <div className="loading">
              Selecciona una venta para ver el detalle
            </div>
          ) : (
            <>
              <div className="badge" style={{ marginBottom: "var(--espaciado-md)", flexWrap: "wrap" }}>
                <span className="pill primario">#{detalleVenta.cabecera.id_venta}</span>
                <span>{detalleVenta.cabecera.cliente}</span>
                <span className="pill">{detalleVenta.cabecera.metodo_pago || "efectivo"}</span>
                <span className={`pill ${detalleVenta.cabecera.estado === "registrada" ? "exito" : "error"}`}>
                  {detalleVenta.cabecera.estado}
                </span>
              </div>

              <div className="tabla-contenedor" style={{ overflowX: "auto" }}>
                <table className="tabla tabla-sm">
                  <thead>
                    <tr>
                      <th style={{ width: 50 }}>Img</th>
                      <th>Producto</th>
                      <th>Cant.</th>
                      <th>Precio</th>
                      <th>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detalleVenta.detalle.map((d) => (
                      <tr key={d.id_detalle}>
                        <td>
                          {d.imagen ? (
                            <img src={d.imagen} alt={d.nombre} className="tabla-imagen" />
                          ) : (
                            <div className="tabla-imagen-placeholder material-symbols-outlined">liquor</div>
                          )}
                        </td>
                        <td>{d.nombre}</td>
                        <td>{d.cantidad}</td>
                        <td>$ {formatearDinero(d.precio)}</td>
                        <td style={{ fontWeight: 600 }}>$ {formatearDinero(d.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={4} style={{ textAlign: "right", fontWeight: 600 }}>TOTAL:</td>
                      <td style={{ fontWeight: 700, fontSize: "var(--texto-lg)" }}>
                        $ {formatearDinero(detalleVenta.cabecera.total)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div style={{ marginTop: "var(--espaciado-md)", fontSize: "var(--texto-sm)", color: "var(--color-texto-muted)" }}>
                <div>Fecha: {new Date(detalleVenta.cabecera.fecha).toLocaleString()}</div>
                <div>Vendedor: {detalleVenta.cabecera.usuario}</div>
              </div>

              {puedeAnular && detalleVenta.cabecera.estado === "registrada" && (
                <div style={{ marginTop: "var(--espaciado-md)" }}>
                  <button
                    className="btn-peligro"
                    onClick={() => anularVenta(detalleVenta.cabecera.id_venta)}
                  >
                    Anular Venta
                  </button>
                </div>
              )}
              {puedeRestaurar && detalleVenta.cabecera.estado === "anulada" && (
                <div style={{ marginTop: "var(--espaciado-md)" }}>
                  <button
                    className="btn-primario"
                    onClick={() => restaurarVenta(detalleVenta.cabecera.id_venta)}
                    disabled={procesando}
                  >
                    {procesando ? "Procesando..." : "Restaurar Venta"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal nuevo cliente */}
      {mostrarNuevoCliente && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: "var(--z-modal)",
            padding: "var(--espaciado-md)",
          }}
          onClick={() => setMostrarNuevoCliente(false)}
        >
          <div
            className="card"
            style={{ maxWidth: 400, width: "100%" }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="card-titulo">Nuevo Cliente Rápido</p>

            <div className="form-grid" style={{ gridTemplateColumns: "1fr" }}>
              <div className="campo">
                <label className="label requerido">Nombre</label>
                <input
                  className="input"
                  placeholder="Nombre del cliente"
                  value={nuevoCliente.nombre}
                  onChange={(e) => setNuevoCliente({ ...nuevoCliente, nombre: e.target.value })}
                  autoFocus
                />
              </div>
              <div className="campo">
                <label className="label">Cédula</label>
                <input
                  className="input"
                  placeholder="Cédula (opcional)"
                  value={nuevoCliente.cedula}
                  onChange={(e) => setNuevoCliente({ ...nuevoCliente, cedula: e.target.value })}
                  maxLength={10}
                />
              </div>
              <div className="campo">
                <label className="label">Teléfono</label>
                <input
                  className="input"
                  placeholder="Teléfono (opcional)"
                  value={nuevoCliente.telefono}
                  onChange={(e) => setNuevoCliente({ ...nuevoCliente, telefono: e.target.value })}
                />
              </div>
            </div>

            <div className="fila" style={{ marginTop: "var(--espaciado-md)", justifyContent: "flex-end" }}>
              <button className="btn-secundario" onClick={() => setMostrarNuevoCliente(false)}>
                Cancelar
              </button>
              <button className="btn-primario" onClick={crearClienteRapido}>
                Crear y Seleccionar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL IA */}
      {mostrarReconocimiento && (
        <ReconocimientoBotella
          onCerrar={() => setMostrarReconocimiento(false)}
          onSeleccionarProducto={(id) => seleccionarYAgregar(id)}
        />
      )}
    </div>
  );
};

export default Ventas;
