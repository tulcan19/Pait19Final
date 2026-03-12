import { useEffect, useState, useCallback } from "react";
import api from "../api/api";
import { cerrarSesion, obtenerToken } from "../api/autenticacion";
import "../estilos/dashboard.css";
import "../estilos/movimientos.css";
import { esAdmin, esOperador, esSupervisor, obtenerUsuario } from "../contextos/sesion";
import { formatearDinero, generarIniciales } from "../helpers/validaciones";

import Productos from "./Productos";
import Movimientos from "./Movimientos";
import Gastos from "./Gastos";
import Ventas from "./Ventas";
import Clientes from "./Clientes";
import Compras from "./Compras";
import AsignacionFefo from "./AsignacionFefo";
import Usuarios from "./Usuarios";
import Estadisticas from "./Estadisticas";
import Categorias from "./Categorias";
import Proveedores from "./Proveedores";
import ConfiguracionTienda from "./ConfiguracionTienda";

type Resumen = {
  total_ventas: string;
  total_compras: string;
  total_gastos: string;
};

type Popular = {
  id_producto: number;
  nombre: string;
  unidades_vendidas: string;
  imagen?: string | null;
};

type Movimiento = {
  id_movimiento: number;
  tipo: "entrada" | "salida" | "ajuste";
  cantidad: number;
  stock_anterior: number;
  stock_actual: number;
  fecha: string;
  producto: string;
  usuario: string;
  imagen?: string | null;
};

type DashboardData = {
  ok: boolean;
  resumen: Resumen;
  productos_populares: Popular[];
  actividad_reciente: Movimiento[];
  stock_bajo: { id_producto: number; nombre: string; stock: number; imagen?: string | null }[];
};

type Pantalla =
  | "dashboard"
  | "productos"
  | "categorias"
  | "movimientos"
  | "clientes"
  | "ventas"
  | "compras"
  | "asignacion_fefo"
  | "proveedores"
  | "gastos"
  | "usuarios"
  | "estadisticas"
  | "config_tienda"
  | "denegado";

// Definición del menú según permisos
type MenuItem = {
  id: Pantalla;
  nombre: string;
  icono: string;
  seccion: string;
  roles: string[];
};

const menuItems: MenuItem[] = [
  { id: "dashboard", nombre: "Dashboard", icono: "bar_chart", seccion: "Principal", roles: ["Administrador", "Supervisor", "Operador"] },
  { id: "ventas", nombre: "Ventas", icono: "receipt_long", seccion: "Operaciones", roles: ["Administrador", "Supervisor", "Operador"] },
  { id: "compras", nombre: "Compras", icono: "inventory_2", seccion: "Operaciones", roles: ["Administrador", "Supervisor", "Operador"] },
  { id: "asignacion_fefo", nombre: "Asignación FEFO", icono: "shopping_basket", seccion: "Operaciones", roles: ["Operador"] },
  { id: "proveedores", nombre: "Proveedores", icono: "contacts", seccion: "Administración", roles: ["Administrador"] },
  { id: "clientes", nombre: "Clientes", icono: "group", seccion: "Operaciones", roles: ["Administrador", "Supervisor", "Operador"] },
  { id: "productos", nombre: "Productos", icono: "local_offer", seccion: "Inventario", roles: ["Administrador", "Supervisor", "Operador"] },
  { id: "categorias", nombre: "Categorías", icono: "folder", seccion: "Inventario", roles: ["Administrador"] },
  { id: "movimientos", nombre: "Movimientos", icono: "assignment", seccion: "Inventario", roles: ["Administrador", "Supervisor", "Operador"] },
  { id: "gastos", nombre: "Gastos", icono: "payments", seccion: "Finanzas", roles: ["Administrador"] },
  { id: "estadisticas", nombre: "Estadísticas", icono: "trending_up", seccion: "Reportes", roles: ["Administrador", "Supervisor", "Operador"] },
  { id: "usuarios", nombre: "Usuarios", icono: "person", seccion: "Administración", roles: ["Administrador"] },
  { id: "config_tienda", nombre: "Editar Tienda", icono: "storefront", seccion: "Administración", roles: ["Administrador"] },
];

const Dashboard = ({ onSalir }: { onSalir: () => void }) => {
  const [datos, setDatos] = useState<DashboardData | null>(null);
  const [cargando, setCargando] = useState(true);
  const [pantalla, setPantalla] = useState<Pantalla>("dashboard");
  const [menuAbierto, setMenuAbierto] = useState(false);

  const usuario = obtenerUsuario();

  // Obtener el rol actual
  const obtenerRolActual = (): string => {
    if (esAdmin()) return "Administrador";
    if (esSupervisor()) return "Supervisor";
    if (esOperador()) return "Operador";
    return "Usuario";
  };

  const rolActual = obtenerRolActual();

  // Filtrar menú según rol
  const menuFiltrado = menuItems.filter(item => item.roles.includes(rolActual));

  // Agrupar menú por sección
  const menuPorSeccion = menuFiltrado.reduce((acc, item) => {
    if (!acc[item.seccion]) acc[item.seccion] = [];
    acc[item.seccion].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  const cargarDashboard = useCallback(async () => {
    try {
      setCargando(true);
      const token = obtenerToken();
      if (!token) {
        onSalir();
        return;
      }

      const resp = await api.get("/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setDatos(resp.data);
    } catch {
      cerrarSesion();
      onSalir();
    } finally {
      setCargando(false);
    }
  }, [onSalir]);

  useEffect(() => {
    cargarDashboard();
  }, [cargarDashboard]);

  const salir = () => {
    cerrarSesion();
    onSalir();
  };

  const ir = (p: Pantalla) => {
    // Verificar permisos
    const item = menuItems.find(m => m.id === p);
    if (item && !item.roles.includes(rolActual)) {
      setPantalla("denegado");
      return;
    }

    setPantalla(p);
    setMenuAbierto(false);
  };

  const volverAlDashboard = () => {
    setPantalla("dashboard");
    cargarDashboard();
  };

  // Renderizar componentes según pantalla
  const renderizarContenido = () => {
    switch (pantalla) {
      case "productos":
        return <Productos volver={volverAlDashboard} />;
      case "categorias":
        return <Categorias volver={volverAlDashboard} />;
      case "movimientos":
        return <Movimientos volver={volverAlDashboard} />;
      case "ventas":
        return <Ventas volver={volverAlDashboard} />;
      case "clientes":
        return <Clientes volver={volverAlDashboard} />;
      case "compras":
        return <Compras volver={volverAlDashboard} />;
      case "asignacion_fefo":
        return <AsignacionFefo volver={volverAlDashboard} />;
      case "proveedores":
        return <Proveedores volver={volverAlDashboard} />;
      case "gastos":
        return <Gastos volver={volverAlDashboard} />;
      case "usuarios":
        return <Usuarios volver={volverAlDashboard} />;
      case "estadisticas":
        return <Estadisticas volver={volverAlDashboard} />;
      case "config_tienda":
        return <ConfiguracionTienda volver={volverAlDashboard} />;
      case "denegado":
        return <VistaDenegado />;
      default:
        return <VistaDashboard />;
    }
  };

  // Vista de acceso denegado
  const VistaDenegado = () => (
    <div className="card">
      <div style={{ textAlign: "center", padding: "var(--espaciado-xl)" }}>
        <div style={{ fontSize: "4rem", marginBottom: "var(--espaciado-md)" }} className="material-symbols-outlined">block</div>
        <h2 style={{ margin: "0 0 var(--espaciado-md)" }}>Acceso Denegado</h2>
        <p style={{ color: "var(--color-texto-muted)", marginBottom: "var(--espaciado-lg)" }}>
          No tienes permisos para acceder a esta sección.
        </p>
        <button className="btn-primario" onClick={() => setPantalla("dashboard")}>
          Volver al Dashboard
        </button>
      </div>
    </div>
  );

  // Vista principal del dashboard
  const VistaDashboard = () => (
    <>
      {cargando && (
        <div className="card">
          <div className="loading">
            <div className="loading-spinner"></div>
            Cargando datos del dashboard...
          </div>
        </div>
      )}

      {!cargando && datos && (
        <>
          {/* Métricas principales */}
          <div
            className="grid-metricas"
            style={{
              gridTemplateColumns: esAdmin() ? "repeat(3, 1fr)" : "repeat(2, 1fr)",
            }}
          >
            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <p className="card-titulo">Total Ventas</p>
                  <p className="card-valor">$ {formatearDinero(datos.resumen.total_ventas)}</p>
                </div>
                {/* <div className="card-icono naranja">🧾</div> */}
              </div>
            </div>

            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <p className="card-titulo">Total Compras</p>
                  <p className="card-valor">$ {formatearDinero(datos.resumen.total_compras)}</p>
                </div>
                {/* <div className="card-icono azul">📦</div> */}
              </div>
            </div>

            {esAdmin() && (
              <div className="card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <p className="card-titulo">Total Gastos</p>
                    <p className="card-valor">$ {formatearDinero(datos.resumen.total_gastos)}</p>
                  </div>
                  {/* <div className="card-icono rojo">💸</div> */}
                </div>
              </div>
            )}
          </div>

          {/* Grid de contenido */}
          <div className="grid-dos">
            {/* Actividad reciente */}
            <div className="card">
              <p className="card-titulo">Actividad Reciente</p>
              <div className="tabla-contenedor">
                <table className="tabla">
                  <thead>
                    <tr>
                      <th style={{ width: 60 }}>Img</th>
                      <th>Fecha</th>
                      <th>Tipo</th>
                      <th>Producto</th>
                      <th className="ocultar-movil">Cant.</th>
                      <th className="ocultar-movil">Usuario</th>
                    </tr>
                  </thead>
                  <tbody>
                    {datos.actividad_reciente.map((m) => (
                      <tr key={m.id_movimiento}>
                        <td>
                          {m.imagen ? (
                            <img
                              src={m.imagen}
                              alt={m.producto}
                              className="tabla-imagen"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = "none";
                              }}
                            />
                          ) : (
                            <div className="tabla-imagen-placeholder material-symbols-outlined">liquor</div>
                          )}
                        </td>
                        <td>{new Date(m.fecha).toLocaleDateString()}</td>
                        <td>
                          <span className={`pill ${m.tipo === 'entrada' ? 'exito' : m.tipo === 'salida' ? 'error' : ''}`}>
                            {m.tipo}
                          </span>
                        </td>
                        <td className="truncar" style={{ maxWidth: 150 }}>{m.producto}</td>
                        <td className="ocultar-movil">{m.cantidad}</td>
                        <td className="ocultar-movil">{m.usuario}</td>
                      </tr>
                    ))}
                    {datos.actividad_reciente.length === 0 && (
                      <tr>
                        <td colSpan={6} className="loading">
                          No hay actividad reciente.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Productos populares y Stock bajo */}
            <div className="card">
              <p className="card-titulo">Productos Populares</p>
              <div className="tabla-contenedor">
                <table className="tabla">
                  <thead>
                    <tr>
                      <th style={{ width: 60 }}>Img</th>
                      <th>Producto</th>
                      <th>Vendidos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {datos.productos_populares.map((p) => (
                      <tr key={p.id_producto}>
                        <td>
                          {p.imagen ? (
                            <img
                              src={p.imagen}
                              alt={p.nombre}
                              className="tabla-imagen"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = "none";
                              }}
                            />
                          ) : (
                            <div className="tabla-imagen-placeholder material-symbols-outlined">liquor</div>
                          )}
                        </td>
                        <td className="truncar" style={{ maxWidth: 150 }}>{p.nombre}</td>
                        <td><span className="pill primario">{p.unidades_vendidas}</span></td>
                      </tr>
                    ))}
                    {datos.productos_populares.length === 0 && (
                      <tr>
                        <td colSpan={3} className="loading">
                          No hay datos de productos populares.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div style={{ height: "var(--espaciado-lg)" }} />

              <p className="card-titulo">
                Stock Bajo
                {datos.stock_bajo.length > 0 && (
                  <span className="pill error" style={{ marginLeft: "var(--espaciado-sm)" }}>
                    {datos.stock_bajo.length}
                  </span>
                )}
              </p>

              {datos.stock_bajo.length === 0 ? (
                <div className="loading" style={{ color: "var(--color-exito)" }}>
                  ✓ No hay productos con stock bajo
                </div>
              ) : (
                <div className="tabla-contenedor">
                  <table className="tabla">
                    <thead>
                      <tr>
                        <th style={{ width: 60 }}>Img</th>
                        <th>Producto</th>
                        <th>Stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {datos.stock_bajo.map((s) => (
                        <tr key={s.id_producto}>
                          <td>
                            {s.imagen ? (
                              <img
                                src={s.imagen}
                                alt={s.nombre}
                                className="tabla-imagen"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = "none";
                                }}
                              />
                            ) : (
                              <div className="tabla-imagen-placeholder material-symbols-outlined">liquor</div>
                            )}
                          </td>
                          <td className="truncar" style={{ maxWidth: 150 }}>{s.nombre}</td>
                          <td><span className="pill error">{s.stock}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );

  return (
    <div className="dashboard">
      {/* Overlay para cerrar menú en móvil */}
      <div
        className={`sidebar-overlay ${menuAbierto ? "visible" : ""}`}
        onClick={() => setMenuAbierto(false)}
      />

      {/* Sidebar */}
      <aside className={`sidebar ${menuAbierto ? "abierto" : ""}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo material-symbols-outlined">wine_bar</div>
          <div className="sidebar-titulo">
            <h1>Sierra Stock</h1>
            <span>Sistema de Licorería</span>
          </div>
          <button
            className="sidebar-cerrar"
            onClick={() => setMenuAbierto(false)}
          >
            ✕
          </button>
        </div>

        <nav className="sidebar-nav">
          {Object.entries(menuPorSeccion).map(([seccion, items]) => (
            <div key={seccion} className="sidebar-seccion">
              <div className="sidebar-seccion-titulo">{seccion}</div>
              <ul className="sidebar-menu">
                {items.map((item) => (
                  <li key={item.id} className="sidebar-item">
                    <button
                      className={`sidebar-link ${pantalla === item.id ? "activo" : ""}`}
                      onClick={() => ir(item.id)}
                    >
                      <span className="sidebar-link-icon material-symbols-outlined">{item.icono}</span>
                      <span className="sidebar-link-texto">{item.nombre}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-usuario">
            <div className="sidebar-usuario-avatar">
              {generarIniciales(usuario?.nombre || "Usuario")}
            </div>
            <div className="sidebar-usuario-info">
              <div className="sidebar-usuario-nombre">{usuario?.nombre || "Usuario"}</div>
              <div className="sidebar-usuario-rol">{rolActual}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Contenido principal */}
      <main className="main-content">
        {/* Topbar */}
        <header className="topbar">
          <div className="topbar-izquierda">
            <button
              className="topbar-hamburguesa"
              onClick={() => setMenuAbierto(true)}
            >
              ☰
            </button>
            <div>
              <h1>{menuItems.find(m => m.id === pantalla)?.nombre || "Dashboard"}</h1>
              <div className="badge">
                <span className="material-symbols-outlined">{menuItems.find(m => m.id === pantalla)?.icono || "bar_chart"}</span>
                <span className="pill">{rolActual}</span>
              </div>
            </div>
          </div>
          <div className="topbar-derecha">
            <button className="btn-salir" onClick={salir}>
              <span className="material-symbols-outlined">logout</span> Cerrar sesión
            </button>
          </div>
        </header>

        {/* Contenido */}
        <div className="dashboard-contenedor">
          {renderizarContenido()}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
