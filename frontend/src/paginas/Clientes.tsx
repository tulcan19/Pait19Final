import { useEffect, useMemo, useState, useCallback } from "react";
import api from "../api/api";
import { obtenerToken } from "../api/autenticacion";
import "../estilos/dashboard.css";
import "../estilos/movimientos.css";
import { esAdmin, esOperador, esSupervisor } from "../contextos/sesion";
import {
  validarNombre,
  validarCedulaEcuador,
  validarTelefono,
  formatearCedula,
  formatearTelefono
} from "../helpers/validaciones";

type Cliente = {
  id_cliente: number;
  nombre: string;
  cedula: string | null;
  telefono: string | null;
  correo: string | null;
  direccion: string | null;
  activo: boolean;
  fecha_creacion?: string;
};

type FormCliente = {
  id_cliente?: number;
  nombre: string;
  cedula: string;
  telefono: string;
  correo: string;
  direccion: string;
};

const Clientes = ({ volver }: { volver: () => void }) => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState("");
  const [tipoMensaje, setTipoMensaje] = useState<"exito" | "error" | "advertencia">("error");
  const [procesando, setProcesando] = useState(false);

  // Formulario
  const [form, setForm] = useState<FormCliente>({
    nombre: "",
    cedula: "",
    telefono: "",
    correo: "",
    direccion: "",
  });
  const [errores, setErrores] = useState<Partial<Record<keyof FormCliente, string>>>({});
  const [editando, setEditando] = useState(false);

  // Filtros
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<"todos" | "activos" | "inactivos">("todos");

  const headers = useMemo(() => {
    const token = obtenerToken();
    return { Authorization: `Bearer ${token}` };
  }, []);

  // Permisos
  const puedeCrear = esAdmin() || esOperador();
  const puedeEditar = esAdmin() || esSupervisor();
  const puedeActivarDesactivar = esAdmin();

  // Cargar clientes
  const cargarClientes = useCallback(async () => {
    setCargando(true);
    try {
      const resp = await api.get("/clientes", { headers });
      setClientes(resp.data.clientes || []);
    } catch {
      mostrarMensaje("No se pudieron cargar los clientes", "error");
    } finally {
      setCargando(false);
    }
  }, [headers]);

  useEffect(() => {
    cargarClientes();
  }, [cargarClientes]);

  // Mostrar mensaje
  const mostrarMensaje = (texto: string, tipo: "exito" | "error" | "advertencia") => {
    setMensaje(texto);
    setTipoMensaje(tipo);
    if (tipo === "exito") {
      setTimeout(() => setMensaje(""), 3000);
    }
  };

  // Validar formulario
  const validarFormulario = (): boolean => {
    const nuevosErrores: Partial<Record<keyof FormCliente, string>> = {};

    // Validar nombre (obligatorio)
    const validacionNombre = validarNombre(form.nombre, 2, 150);
    if (!validacionNombre.valido) {
      nuevosErrores.nombre = validacionNombre.mensaje;
    }

    // Validar cédula (obligatoria para clientes formales, opcional para consumidor final)
    if (form.cedula.trim()) {
      const validacionCedula = validarCedulaEcuador(form.cedula);
      if (!validacionCedula.valido) {
        nuevosErrores.cedula = validacionCedula.mensaje;
      }

      // Verificar cédula duplicada
      const cedulaNormalizada = form.cedula.replace(/[\s-]/g, "");
      const existeDuplicado = clientes.some(
        c => c.cedula?.replace(/[\s-]/g, "") === cedulaNormalizada && c.id_cliente !== form.id_cliente
      );
      if (existeDuplicado) {
        nuevosErrores.cedula = "Ya existe un cliente con esta cédula";
      }
    }

    // Validar teléfono (opcional pero si tiene, debe ser válido)
    if (form.telefono.trim()) {
      const validacionTelefono = validarTelefono(form.telefono);
      if (!validacionTelefono.valido) {
        nuevosErrores.telefono = validacionTelefono.mensaje;
      }
    }

    // Validar correo (opcional pero si tiene, debe tener formato válido)
    if (form.correo.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.correo)) {
        nuevosErrores.correo = "Formato de correo inválido";
      }
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  // Limpiar formulario
  const limpiarFormulario = () => {
    setForm({
      nombre: "",
      cedula: "",
      telefono: "",
      correo: "",
      direccion: "",
    });
    setErrores({});
    setEditando(false);
  };

  // Guardar cliente
  const guardar = async () => {
    if (editando && !puedeEditar) {
      mostrarMensaje("No tienes permisos para editar clientes", "error");
      return;
    }

    if (!editando && !puedeCrear) {
      mostrarMensaje("No tienes permisos para crear clientes", "error");
      return;
    }

    if (!validarFormulario()) {
      return;
    }

    setProcesando(true);

    try {
      const body = {
        nombre: form.nombre.trim(),
        cedula: form.cedula.trim() ? formatearCedula(form.cedula) : null,
        telefono: form.telefono.trim() || null,
        correo: form.correo.trim().toLowerCase() || null,
        direccion: form.direccion.trim() || null,
      };

      if (form.id_cliente) {
        await api.patch(`/clientes/${form.id_cliente}`, body, { headers });
        mostrarMensaje("Cliente actualizado correctamente", "exito");
      } else {
        await api.post("/clientes", body, { headers });
        mostrarMensaje("Cliente creado correctamente", "exito");
      }

      limpiarFormulario();
      await cargarClientes();
    } catch (error: any) {
      const msg = error?.response?.data?.mensaje || "Error al guardar el cliente";
      mostrarMensaje(msg, "error");
    } finally {
      setProcesando(false);
    }
  };

  // Editar cliente
  const editar = (cliente: Cliente) => {
    if (!puedeEditar) {
      mostrarMensaje("No tienes permisos para editar clientes", "error");
      return;
    }

    setForm({
      id_cliente: cliente.id_cliente,
      nombre: cliente.nombre || "",
      cedula: cliente.cedula || "",
      telefono: cliente.telefono || "",
      correo: cliente.correo || "",
      direccion: cliente.direccion || "",
    });
    setEditando(true);
    setErrores({});
  };

  // Activar/Desactivar cliente
  const toggleActivo = async (cliente: Cliente) => {
    if (!puedeActivarDesactivar) {
      mostrarMensaje("Solo el Administrador puede activar/desactivar clientes", "error");
      return;
    }

    try {
      const endpoint = cliente.activo
        ? `/clientes/${cliente.id_cliente}/desactivar`
        : `/clientes/${cliente.id_cliente}/activar`;

      await api.patch(endpoint, {}, { headers });
      mostrarMensaje(
        `Cliente ${cliente.activo ? "desactivado" : "activado"} correctamente`,
        "exito"
      );
      await cargarClientes();
    } catch (error: any) {
      const msg = error?.response?.data?.mensaje || "Error al cambiar estado";
      mostrarMensaje(msg, "error");
    }
  };

  // Filtrar clientes
  const clientesFiltrados = clientes.filter((c) => {
    // Filtro de estado
    if (filtroEstado === "activos" && !c.activo) return false;
    if (filtroEstado === "inactivos" && c.activo) return false;

    // Filtro de búsqueda
    const termino = busqueda.trim().toLowerCase();
    if (!termino) return true;
    return (
      c.nombre.toLowerCase().includes(termino) ||
      (c.cedula || "").toLowerCase().includes(termino) ||
      (c.telefono || "").toLowerCase().includes(termino) ||
      (c.correo || "").toLowerCase().includes(termino)
    );
  });

  // Manejar cambio de cédula con formato
  const handleCedulaChange = (valor: string) => {
    const formateada = formatearCedula(valor);
    setForm({ ...form, cedula: formateada });

    if (errores.cedula && formateada.length >= 10) {
      const validacion = validarCedulaEcuador(formateada);
      setErrores(prev => ({ ...prev, cedula: validacion.valido ? undefined : validacion.mensaje }));
    }
  };

  return (
    <div className="card">
      {/* Header */}
      <div className="topbar" style={{ marginBottom: "var(--espaciado-md)" }}>
        <div>
          <h1 style={{ margin: 0 }}>Clientes</h1>
          <div className="badge">
            <span className="material-symbols-outlined">groups</span>
            <span>Gestión de clientes</span>
            {/* <span className={`pill ${esSupervisor() ? "advertencia" : "primario"}`}>
              {esSupervisor() ? "Solo edición" : puedeCrear ? "CRUD completo" : "Solo lectura"}
            </span> */}
          </div>
        </div>
        <button className="btn-salir" onClick={volver}>
          ← Volver
        </button>
      </div>

      {/* Formulario */}
      {(puedeCrear || puedeEditar) && (
        <div className="card" style={{ marginBottom: "var(--espaciado-md)" }}>
          <p className="card-titulo">
            {editando ? "Editar Cliente" : "Nuevo Cliente"}
          </p>

          <div className="form-grid">
            {/* Nombre */}
            <div className="campo full">
              <label className="label requerido">Nombre completo</label>
              <input
                className={`input ${errores.nombre ? "error" : ""}`}
                placeholder="Nombre del cliente"
                value={form.nombre}
                onChange={(e) => {
                  setForm({ ...form, nombre: e.target.value });
                  if (errores.nombre) {
                    const val = validarNombre(e.target.value, 2, 150);
                    setErrores(prev => ({ ...prev, nombre: val.valido ? undefined : val.mensaje }));
                  }
                }}
                maxLength={150}
              />
              {errores.nombre && <span className="campo-error">{errores.nombre}</span>}
            </div>

            {/* Cédula */}
            <div className="campo">
              <label className="label">Cédula</label>
              <input
                className={`input ${errores.cedula ? "error" : ""}`}
                placeholder="1234567890"
                value={form.cedula}
                onChange={(e) => handleCedulaChange(e.target.value)}
                maxLength={10}
              />
              {errores.cedula && <span className="campo-error">{errores.cedula}</span>}
              {/* <span className="campo-ayuda">Cédula ecuatoriana de 10 dígitos</span> */}
            </div>

            {/* Teléfono */}
            <div className="campo">
              <label className="label">Teléfono</label>
              <input
                className={`input ${errores.telefono ? "error" : ""}`}
                placeholder="0999999999"
                value={form.telefono}
                onChange={(e) => {
                  setForm({ ...form, telefono: e.target.value });
                  if (errores.telefono) {
                    const val = validarTelefono(e.target.value);
                    setErrores(prev => ({ ...prev, telefono: val.valido ? undefined : val.mensaje }));
                  }
                }}
                maxLength={15}
              />
              {errores.telefono && <span className="campo-error">{errores.telefono}</span>}
            </div>

            {/* Correo */}
            <div className="campo">
              <label className="label">Correo electrónico</label>
              <input
                className={`input ${errores.correo ? "error" : ""}`}
                type="email"
                placeholder="cliente@email.com"
                value={form.correo}
                onChange={(e) => {
                  setForm({ ...form, correo: e.target.value });
                  if (errores.correo) {
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    setErrores(prev => ({
                      ...prev,
                      correo: emailRegex.test(e.target.value) ? undefined : "Formato inválido"
                    }));
                  }
                }}
              />
              {errores.correo && <span className="campo-error">{errores.correo}</span>}
            </div>

            {/* Dirección */}
            <div className="campo">
              <label className="label">Dirección</label>
              <input
                className="input"
                placeholder="Dirección (opcional)"
                value={form.direccion}
                onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                maxLength={255}
              />
            </div>
          </div>

          <div className="fila" style={{ marginTop: "var(--espaciado-md)", justifyContent: "flex-start" }}>
            <button
              className="btn-primario"
              onClick={guardar}
              disabled={procesando || (editando && !puedeEditar) || (!editando && !puedeCrear)}
            >
              {procesando ? "Guardando..." : editando ? "Actualizar" : "Crear Cliente"}
            </button>
            {editando && (
              <button className="btn-secundario" onClick={limpiarFormulario}>
                Cancelar
              </button>
            )}
          </div>
        </div>
      )}

      {/* Mensaje */}
      {mensaje && (
        <div className={`mensaje ${tipoMensaje}`} style={{ marginBottom: "var(--espaciado-md)" }}>
          {mensaje}
        </div>
      )}

      {/* Filtros */}
      <div className="filtros">
        <input
          className="input"
          placeholder="Buscar por nombre, cédula, teléfono o correo..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <select
          className="select"
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value as typeof filtroEstado)}
        >
          <option value="todos">Todos los estados</option>
          <option value="activos">Solo activos</option>
          <option value="inactivos">Solo inactivos</option>
        </select>
        <button className="btn-secundario" onClick={cargarClientes} disabled={cargando} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {cargando ? "..." : <span className="material-symbols-outlined">refresh</span>}
        </button>
      </div>

      {/* Tabla */}
      {cargando ? (
        <div className="loading">
          <div className="loading-spinner"></div>
          Cargando clientes...
        </div>
      ) : (
        <div className="tabla-contenedor">
          <table className="tabla">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Cédula</th>
                <th className="ocultar-movil">Teléfono</th>
                <th className="ocultar-movil">Correo</th>
                <th>Estado</th>
                <th style={{ width: 180 }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {clientesFiltrados.map((cliente) => (
                <tr key={cliente.id_cliente}>
                  <td style={{ fontWeight: 600 }}>{cliente.nombre}</td>
                  <td>{cliente.cedula || <span style={{ color: "var(--color-texto-muted)" }}>-</span>}</td>
                  <td className="ocultar-movil">
                    {cliente.telefono ? formatearTelefono(cliente.telefono) : <span style={{ color: "var(--color-texto-muted)" }}>-</span>}
                  </td>
                  <td className="ocultar-movil">
                    {cliente.correo || <span style={{ color: "var(--color-texto-muted)" }}>-</span>}
                  </td>
                  <td>
                    <span className={`pill ${cliente.activo ? "exito" : "error"}`}>
                      {cliente.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td>
                    <div className="acciones">
                      {puedeEditar && (
                        <button
                          className="btn-secundario btn-sm"
                          onClick={() => editar(cliente)}
                        >
                          Editar
                        </button>
                      )}
                      {puedeActivarDesactivar && (
                        <button
                          className={`btn-sm ${cliente.activo ? "btn-peligro" : "btn-exito"}`}
                          onClick={() => toggleActivo(cliente)}
                        >
                          {cliente.activo ? "Desactivar" : "Activar"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {clientesFiltrados.length === 0 && (
                <tr>
                  <td colSpan={6} className="loading">
                    {busqueda || filtroEstado !== "todos"
                      ? "No se encontraron clientes con ese criterio"
                      : "No hay clientes registrados"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Info de total */}
      <div style={{ marginTop: "var(--espaciado-md)", color: "var(--color-texto-muted)", fontSize: "var(--texto-sm)" }}>
        Mostrando {clientesFiltrados.length} de {clientes.length} cliente(s)
      </div>
    </div>
  );
};

export default Clientes;
