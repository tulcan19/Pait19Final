import { useEffect, useMemo, useState, useCallback } from "react";
import api from "../api/api";
import { obtenerToken } from "../api/autenticacion";
import "../estilos/dashboard.css";
import "../estilos/movimientos.css";
import { esAdmin } from "../contextos/sesion";
import { validarNombre } from "../helpers/validaciones";

type Categoria = {
  id_categoria: number;
  nombre: string;
  descripcion: string | null;
  imagen: string | null;
  activo: boolean;
};

type FormCategoria = {
  id_categoria?: number;
  nombre: string;
  descripcion: string;
  imagen: string | null;
};

const Categorias = ({ volver }: { volver: () => void }) => {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState("");
  const [tipoMensaje, setTipoMensaje] = useState<"exito" | "error" | "advertencia">("error");
  const [procesando, setProcesando] = useState(false);

  // Formulario
  const [form, setForm] = useState<FormCategoria>({
    nombre: "",
    descripcion: "",
    imagen: null,
  });
  const [errores, setErrores] = useState<{ nombre?: string; descripcion?: string }>({});
  const [editando, setEditando] = useState(false);

  // Filtro
  const [busqueda, setBusqueda] = useState("");

  const headers = useMemo(() => {
    const token = obtenerToken();
    return { Authorization: `Bearer ${token}` };
  }, []);

  const puedeEditar = esAdmin();

  // Cargar categorías
  const cargarCategorias = useCallback(async () => {
    setCargando(true);
    try {
      const resp = await api.get("/categorias", { headers });
      setCategorias(resp.data.categorias || []);
    } catch {
      mostrarMensaje("No se pudieron cargar las categorías", "error");
    } finally {
      setCargando(false);
    }
  }, [headers]);

  useEffect(() => {
    cargarCategorias();
  }, [cargarCategorias]);

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
    const nuevosErrores: { nombre?: string; descripcion?: string } = {};

    const validacionNombre = validarNombre(form.nombre, 2, 100);
    if (!validacionNombre.valido) {
      nuevosErrores.nombre = validacionNombre.mensaje;
    }

    // Verificar duplicados (solo si es nuevo o cambió el nombre)
    const nombreNormalizado = form.nombre.trim().toLowerCase();
    const existeDuplicado = categorias.some(
      c => c.nombre.toLowerCase() === nombreNormalizado && c.id_categoria !== form.id_categoria
    );
    if (existeDuplicado) {
      nuevosErrores.nombre = "Ya existe una categoría con este nombre";
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  // Limpiar formulario
  const limpiarFormulario = () => {
    setForm({ nombre: "", descripcion: "", imagen: null });
    setErrores({});
    setEditando(false);
  };

  // Convertir imagen a Base64
  const convertirImagenABase64 = (archivo: File) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(archivo);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  // Guardar categoría
  const guardar = async () => {
    if (!puedeEditar) {
      mostrarMensaje("No tienes permisos para esta acción", "error");
      return;
    }

    if (!validarFormulario()) {
      return;
    }

    setProcesando(true);

    try {
      const body = {
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim() || null,
        imagen: form.imagen,
      };

      if (form.id_categoria) {
        await api.put(`/categorias/${form.id_categoria}`, body, { headers });
        mostrarMensaje("Categoría actualizada correctamente", "exito");
      } else {
        await api.post("/categorias", body, { headers });
        mostrarMensaje("Categoría creada correctamente", "exito");
      }

      limpiarFormulario();
      await cargarCategorias();
    } catch (error: any) {
      const msg = error?.response?.data?.mensaje || "Error al guardar la categoría";
      mostrarMensaje(msg, "error");
    } finally {
      setProcesando(false);
    }
  };

  // Editar categoría
  const editar = (categoria: Categoria) => {
    setForm({
      id_categoria: categoria.id_categoria,
      nombre: categoria.nombre,
      descripcion: categoria.descripcion || "",
      imagen: categoria.imagen,
    });
    setEditando(true);
    setErrores({});
  };

  // Activar/Desactivar categoría
  const toggleActivo = async (categoria: Categoria) => {
    if (!puedeEditar) {
      mostrarMensaje("No tienes permisos para esta acción", "error");
      return;
    }

    try {
      const endpoint = categoria.activo
        ? `/categorias/${categoria.id_categoria}/desactivar`
        : `/categorias/${categoria.id_categoria}/activar`;

      await api.patch(endpoint, {}, { headers });
      mostrarMensaje(
        `Categoría ${categoria.activo ? "desactivada" : "activada"} correctamente`,
        "exito"
      );
      await cargarCategorias();
    } catch (error: any) {
      const msg = error?.response?.data?.mensaje || "Error al cambiar estado";
      mostrarMensaje(msg, "error");
    }
  };

  // Eliminar categoría
  const eliminar = async (id: number) => {
    if (!puedeEditar) {
      mostrarMensaje("No tienes permisos para esta acción", "error");
      return;
    }

    if (!window.confirm("¿Estás seguro de eliminar esta categoría? Esta acción no se puede deshacer.")) {
      return;
    }

    try {
      await api.delete(`/categorias/${id}`, { headers });
      mostrarMensaje("Categoría eliminada correctamente", "exito");
      await cargarCategorias();
    } catch (error: any) {
      const msg = error?.response?.data?.mensaje || "No se puede eliminar la categoría (tiene productos asociados)";
      mostrarMensaje(msg, "error");
    }
  };

  // Filtrar categorías
  const categoriasFiltradas = categorias.filter((c) => {
    const termino = busqueda.trim().toLowerCase();
    if (!termino) return true;
    return (
      c.nombre.toLowerCase().includes(termino) ||
      (c.descripcion || "").toLowerCase().includes(termino)
    );
  });

  return (
    <div className="card">
      {/* Header */}
      <div className="topbar" style={{ marginBottom: "var(--espaciado-md)" }}>
        <div>
          <h1 style={{ margin: 0 }}>Categorías</h1>
          <div className="badge">
            <span className="material-symbols-outlined">folder</span>
            <span>Gestión de categorías de productos</span>
            <span className="pill primario">Solo Administrador</span>
          </div>
        </div>
        <button className="btn-salir" onClick={volver}>
          ← Volver
        </button>
      </div>

      {/* Formulario */}
      {puedeEditar && (
        <div className="card" style={{ marginBottom: "var(--espaciado-md)" }}>
          <p className="card-titulo">
            {editando ? "Editar Categoría" : "Nueva Categoría"}
          </p>

          <div className="form-grid">
            <div className="campo">
              <label className="label requerido">Nombre</label>
              <input
                className={`input ${errores.nombre ? "error" : ""}`}
                placeholder="Nombre de la categoría"
                value={form.nombre}
                onChange={(e) => {
                  setForm({ ...form, nombre: e.target.value });
                  if (errores.nombre) {
                    const val = validarNombre(e.target.value, 2, 100);
                    setErrores(prev => ({ ...prev, nombre: val.valido ? undefined : val.mensaje }));
                  }
                }}
                maxLength={100}
              />
              {errores.nombre && <span className="campo-error">{errores.nombre}</span>}
            </div>

            <div className="campo">
              <label className="label">Descripción</label>
              <input
                className="input"
                placeholder="Descripción (opcional)"
                value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                maxLength={255}
              />
            </div>

            <div className="campo full">
              <label className="label">Imagen de Categoría</label>
              <div style={{ display: "flex", gap: "var(--espaciado-md)", alignItems: "center" }}>
                {form.imagen && (
                  <img
                    src={form.imagen}
                    alt="Preview"
                    style={{ width: 60, height: 60, borderRadius: 8, objectFit: "cover", border: "1px solid var(--color-borde)" }}
                  />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      try {
                        const base64 = await convertirImagenABase64(file);
                        setForm({ ...form, imagen: base64 as string });
                      } catch (err) {
                        mostrarMensaje("Error al procesar la imagen", "error");
                      }
                    }
                  }}
                  className="input"
                  style={{ flex: 1 }}
                />
                {form.imagen && (
                  <button
                    className="btn-peligro btn-sm"
                    onClick={() => setForm({ ...form, imagen: null })}
                    style={{ padding: "8px" }}
                  >
                    <span className="material-symbols-outlined">delete</span>
                  </button>
                )}
              </div>
              <p className="campo-ayuda">Se recomienda una imagen cuadrada para las categorías destacadas.</p>
            </div>
          </div>

          <div className="fila" style={{ marginTop: "var(--espaciado-md)", justifyContent: "flex-start" }}>
            <button
              className="btn-primario"
              onClick={guardar}
              disabled={procesando}
            >
              {procesando ? "Guardando..." : editando ? "Actualizar" : "Crear Categoría"}
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

      {/* Filtro y listado */}
      <div className="fila" style={{ marginBottom: "var(--espaciado-md)" }}>
        <input
          className="input"
          style={{ flex: 1 }}
          placeholder="Buscar por nombre o descripción..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <button className="btn-secundario" onClick={cargarCategorias} disabled={cargando} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {cargando ? "Cargando..." : <><span className="material-symbols-outlined" style={{ marginRight: 4 }}>refresh</span> Recargar</>}
        </button>
      </div>

      {/* Tabla */}
      {cargando ? (
        <div className="loading">
          <div className="loading-spinner"></div>
          Cargando categorías...
        </div>
      ) : (
        <div className="tabla-contenedor">
          <table className="tabla">
            <thead>
              <tr>
                <th style={{ width: 40 }}></th>
                <th>ID</th>
                <th>Nombre</th>
                <th>Descripción</th>
                <th>Estado</th>
                {puedeEditar && <th style={{ width: 200 }}>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {categoriasFiltradas.map((categoria) => (
                <CategoriaRow 
                  key={categoria.id_categoria} 
                  categoria={categoria as any} 
                  puedeEditar={puedeEditar}
                  editar={editar}
                  toggleActivo={toggleActivo}
                  eliminar={eliminar}
                  headers={headers}
                  recargar={cargarCategorias}
                  mostrarMensaje={mostrarMensaje}
                  todasLasCategorias={categorias}
                />
              ))}
              {categoriasFiltradas.length === 0 && (
                <tr>
                  <td colSpan={puedeEditar ? 6 : 5} className="loading">
                    {busqueda
                      ? "No se encontraron categorías con ese criterio"
                      : "No hay categorías registradas"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Info de total */}
      <div style={{ marginTop: "var(--espaciado-md)", color: "var(--color-texto-muted)", fontSize: "var(--texto-sm)" }}>
        Total: {categoriasFiltradas.length} categoría(s)
        {busqueda && ` de ${categorias.length}`}
      </div>
    </div>
  );
};

// --- Sub-componente para cada fila con gestión de subcategorías ---
const CategoriaRow = ({ categoria, puedeEditar, editar, toggleActivo, eliminar, headers, recargar, mostrarMensaje, todasLasCategorias }: any) => {
  const [expandido, setExpandido] = useState(false);
  const [nuevaSub, setNuevaSub] = useState("");
  const [idCatVinculada, setIdCatVinculada] = useState<number | "">("");
  const [modoVinculo, setModoVinculo] = useState(false);
  const [procesandoSub, setProcesandoSub] = useState(false);

  const agregarSub = async () => {
    if (!modoVinculo && !nuevaSub.trim()) return;
    if (modoVinculo && !idCatVinculada) return;

    setProcesandoSub(true);
    try {
      await api.post("/categorias/subcategorias", {
        id_categoria: categoria.id_categoria,
        nombre: modoVinculo ? null : nuevaSub.trim(),
        id_categoria_vinculada: modoVinculo ? Number(idCatVinculada) : null
      }, { headers });
      setNuevaSub("");
      setIdCatVinculada("");
      recargar();
    } catch {
      mostrarMensaje("Error al crear subcategoría", "error");
    } finally {
      setProcesandoSub(false);
    }
  };

  const eliminarSub = async (id: number) => {
    if (!window.confirm("¿Eliminar esta subcategoría?")) return;
    try {
      await api.delete(`/categorias/subcategorias/${id}`, { headers });
      recargar();
    } catch {
      mostrarMensaje("Error al eliminar subcategoría", "error");
    }
  };

  return (
    <>
      <tr style={{ background: expandido ? "var(--color-fondo-hover)" : "transparent" }}>
        <td>
          <button 
            className="btn-texto btn-sm" 
            onClick={() => setExpandido(!expandido)}
            style={{ padding: 0, minWidth: 32 }}
          >
            <span className="material-symbols-outlined" style={{ 
              transform: expandido ? "rotate(180deg)" : "none",
              transition: "transform 0.2s"
            }}>
              keyboard_arrow_down
            </span>
          </button>
        </td>
        <td>{categoria.id_categoria}</td>
        <td style={{ display: "flex", alignItems: "center", gap: "var(--espaciado-sm)" }}>
          {categoria.imagen ? (
            <img src={categoria.imagen} alt={categoria.nombre} style={{ width: 32, height: 32, borderRadius: 4, objectFit: "cover" }} />
          ) : (
            <div style={{ width: 32, height: 32, borderRadius: 4, background: "var(--color-fondo-hover)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: "var(--color-texto-muted)" }}>folder</span>
            </div>
          )}
          <span style={{ fontWeight: 600 }}>{categoria.nombre}</span>
        </td>
        <td style={{ color: "var(--color-texto-muted)" }}>
          {categoria.descripcion || "-"}
        </td>
        <td>
          <span className={`pill ${categoria.activo ? "exito" : "error"}`}>
            {categoria.activo ? "Activo" : "Inactivo"}
          </span>
        </td>
        {puedeEditar && (
          <td>
            <div className="acciones">
              <button className="btn-secundario btn-sm" onClick={() => editar(categoria)}>Editar</button>
              <button className={`btn-sm ${categoria.activo ? "btn-peligro" : "btn-exito"}`} onClick={() => toggleActivo(categoria)}>
                {categoria.activo ? "Desactivar" : "Activar"}
              </button>
              <button className="btn-peligro btn-sm" onClick={() => eliminar(categoria.id_categoria)}>Eliminar</button>
            </div>
          </td>
        )}
      </tr>
      {expandido && (
        <tr style={{ background: "rgba(255,255,255,0.02)" }}>
          <td></td>
          <td colSpan={5} style={{ padding: "12px 24px" }}>
            <div style={{ borderLeft: "2px solid var(--color-primario)", paddingLeft: 16 }}>
              <p style={{ margin: "0 0 12px 0", fontSize: "0.85rem", fontWeight: 600, color: "var(--color-primario)" }}>SUBCATEGORÍAS</p>
              
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                {categoria.subcategorias && categoria.subcategorias.length > 0 ? (
                  categoria.subcategorias.map((sub: any) => (
                    <div 
                      key={sub.id_subcategoria}
                      style={{ 
                        background: "var(--color-fondo)", 
                        border: sub.id_categoria_vinculada ? "1px solid var(--color-primario)" : "1px solid var(--color-borde)",
                        padding: "4px 10px",
                        borderRadius: 16,
                        fontSize: "0.8rem",
                        display: "flex",
                        alignItems: "center",
                        gap: 10
                      }}
                      title={sub.id_categoria_vinculada ? "Categoría vinculada" : "Texto manual"}
                    >
                      {sub.id_categoria_vinculada && (
                        <span className="material-symbols-outlined" style={{ fontSize: 16, color: "var(--color-primario)" }}>link</span>
                      )}
                      {sub.nombre_final}
                      {puedeEditar && (
                        <button 
                          onClick={() => eliminarSub(sub.id_subcategoria)}
                          style={{ background: "none", border: "none", color: "var(--color-error)", cursor: "pointer", padding: 0 }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>close</span>
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <span style={{ fontSize: "0.8rem", color: "var(--color-texto-muted)" }}>No hay subcategorías</span>
                )}
              </div>

              {puedeEditar && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 450 }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <button 
                      className={`btn-sm ${!modoVinculo ? 'btn-primario' : 'btn-secundario'}`}
                      style={{ padding: "4px 12px", fontSize: "0.75rem" }}
                      onClick={() => setModoVinculo(false)}
                    >
                      Texto Manual
                    </button>
                    <button 
                      className={`btn-sm ${modoVinculo ? 'btn-primario' : 'btn-secundario'}`}
                      style={{ padding: "4px 12px", fontSize: "0.75rem" }}
                      onClick={() => setModoVinculo(true)}
                    >
                      Vincular Categoría
                    </button>
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
                    {!modoVinculo ? (
                      <input 
                        className="input btn-sm" 
                        placeholder="Nueva subcategoría..." 
                        value={nuevaSub}
                        onChange={(e) => setNuevaSub(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && agregarSub()}
                        style={{ flex: 1, padding: "4px 8px" }}
                      />
                    ) : (
                      <select
                        className="select btn-sm"
                        value={idCatVinculada}
                        onChange={(e) => setIdCatVinculada(e.target.value === "" ? "" : Number(e.target.value))}
                        style={{ flex: 1, padding: "4px 8px", fontSize: "0.85rem" }}
                      >
                        <option value="">Selecciona categoría...</option>
                        {todasLasCategorias
                          .filter((c: any) => c.id_categoria !== categoria.id_categoria)
                          .map((c: any) => (
                            <option key={c.id_categoria} value={c.id_categoria}>
                              {c.nombre}
                            </option>
                          ))}
                      </select>
                    )}
                    <button 
                      className="btn-primario btn-sm" 
                      onClick={agregarSub}
                      disabled={procesandoSub}
                      style={{ padding: "4px 12px" }}
                    >
                      {procesandoSub ? "..." : "Añadir"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

export default Categorias;
