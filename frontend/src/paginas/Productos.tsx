import { useEffect, useMemo, useState, useCallback } from "react";
import api from "../api/api";
import { obtenerToken } from "../api/autenticacion";
import "../estilos/dashboard.css";
import "../estilos/productos.css";
import { esAdmin, esOperador, esSupervisor } from "../contextos/sesion";
import { convertirImagenABase64, puedeSubirImagenes } from "../helpers/imagenHelper";
import ReconocimientoBotella from "../componentes/ReconocimientoBotella";

type Categoria = {
  id_categoria: number;
  nombre: string;
  subcategorias?: { id_subcategoria: number; nombre: string }[];
};

type Producto = {
  id_producto: number;
  nombre: string;
  descripcion: string;
  precio: string;
  stock: number;
  id_categoria: number;
  id_subcategoria?: number | null;
  categoria?: string;
  subcategoria_nombre?: string;
  activo: boolean;
  imagen?: string | null;
};

type FormProducto = {
  id_producto?: number;
  nombre: string;
  descripcion: string;
  precio: string;
  stock: number;
  id_categoria: number;
  id_subcategoria: number | "ninguna";
  imagen?: string | null;
};

const ModalImportarMasivo = ({
  onCerrar,
  onImportado,
  categorias,
  headers
}: {
  onCerrar: () => void;
  onImportado: () => void;
  categorias: Categoria[];
  headers: any;
}) => {
  const [datos, setDatos] = useState("");
  const [procesando, setProcesando] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  const procesarImportacion = async () => {
    if (!datos.trim()) return;
    setProcesando(true);
    setLog(["Procesando datos..."]);

    try {
      const lineas = datos.split("\n").filter(l => l.trim().length > 0);
      const productosAImportar: any[] = [];
      const errores: string[] = [];

      const parseCSVLine = (text: string) => {
        const result = [];
        let field = "";
        let inQuotes = false;
        for (let i = 0; i < text.length; i++) {
          const char = text[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            result.push(field.trim());
            field = "";
          } else {
            field += char;
          }
        }
        result.push(field.trim());
        return result.map(f => f.replace(/^"|"$/g, '').trim());
      };

      lineas.forEach((linea, index) => {
        const columnas = parseCSVLine(linea);
        
        if (columnas.length < 3) {
          errores.push(`Línea ${index + 1}: Faltan columnas (mínimo Nombre, Precio, Categoría)`);
          return;
        }

        const nombre = columnas[0];

        // Omitir encabezado si existe
        if (index === 0 && (nombre.toLowerCase() === "nombre" || nombre.toLowerCase() === "nombre del producto" || nombre.toLowerCase() === "categoría")) {
           return;
        }

        let descripcion = "";
        let precio = "";
        let stock = "0";
        let nombreCat = "";

        if (columnas.length >= 5) {
          descripcion = columnas[1];
          precio = columnas[2];
          stock = columnas[3];
          nombreCat = columnas[4];
        } else if (columnas.length === 4) {
          precio = columnas[1];
          stock = columnas[2];
          nombreCat = columnas[3];
        } else if (columnas.length === 3) {
          precio = columnas[1];
          nombreCat = columnas[2];
        }

        const catEncontrada = categorias.find(
          c => c.nombre.toLowerCase() === nombreCat.toLowerCase()
        );

        if (!catEncontrada) {
          errores.push(`Línea ${index + 1}: Categoría "${nombreCat}" no encontrada (Nombre: ${nombre})`);
          return;
        }

        productosAImportar.push({
          nombre,
          descripcion,
          precio: Number(precio.replace('$', '').trim()),
          stock: Number(stock),
          id_categoria: catEncontrada.id_categoria,
          id_proveedor: null,
          imagen: null
        });
      });

      if (errores.length > 0) {
        setLog(prev => [...prev, ...errores, "❌ Importación cancelada por errores."]);
        setProcesando(false);
        return;
      }

      setLog(prev => [...prev, `Enviando ${productosAImportar.length} productos al servidor...`]);
      
      await api.post("/productos/masivo", productosAImportar, { headers });
      
      setLog(prev => [...prev, "✅ ¡Importación exitosa!"]);
      setTimeout(() => {
        onImportado();
        onCerrar();
      }, 1500);

    } catch (error: any) {
      console.error(error);
      setLog(prev => [...prev, `❌ Error: ${error.response?.data?.mensaje || error.message}`]);
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className="modal-fondo" onClick={onCerrar}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
        <h3>Importación Masiva</h3>
        <p style={{ fontSize: '14px', color: '#cbd5e1', marginBottom: '10px' }}>
          Pega tus productos abajo. Formato: <b>Nombre, Descripción, Precio, Stock, Categoría</b><br/>
          <i>Ejemplo: Ron Abuelo, 750ml, 18.50, 24, Destilado</i>
        </p>
        
        <textarea
          className="input"
          style={{ height: '200px', fontFamily: 'monospace', fontSize: '13px', resize: 'vertical', width: '100%', boxSizing: 'border-box' }}
          placeholder="Producto 1, Desc, 10.00, 5, Cerveza&#10;Producto 2, Desc, 12.50, 10, Destilado"
          value={datos}
          onChange={(e) => setDatos(e.target.value)}
          disabled={procesando}
        />

        {log.length > 0 && (
          <div style={{ 
            marginTop: '10px', 
            padding: '10px', 
            backgroundColor: '#0f172a', 
            borderRadius: '4px', 
            fontSize: '12px',
            maxHeight: '100px',
            overflowY: 'auto'
          }}>
            {log.map((linea, i) => (
              <div key={i} style={{ color: linea.startsWith('❌') ? '#ef4444' : linea.startsWith('✅') ? '#22c55e' : '#94a3b8' }}>
                {linea}
              </div>
            ))}
          </div>
        )}

        <div className="fila" style={{ justifyContent: "flex-end", marginTop: 14 }}>
          <button className="btn-secundario" onClick={onCerrar} disabled={procesando}>
            Cancelar
          </button>
          <button className="btn-primario" onClick={procesarImportacion} disabled={procesando || !datos.trim()}>
            {procesando ? "Procesando..." : "Importar Productos"}
          </button>
        </div>
      </div>
    </div>
  );
};

const Productos = ({ volver }: { volver: () => void }) => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cargando, setCargando] = useState(true);

  const [busqueda, setBusqueda] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState<number | "todas">("todas");

  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState(false);
  const [mensaje, setMensaje] = useState<React.ReactNode>("");
  const [mostrarReconocimiento, setMostrarReconocimiento] = useState(false);
  const [modalImportarAbierto, setModalImportarAbierto] = useState(false);

  const [form, setForm] = useState<FormProducto>({
    nombre: "",
    descripcion: "",
    precio: "",
    stock: 0,
    id_categoria: 1,
    id_subcategoria: "ninguna",
    imagen: null,
  });

  const puedeEditar = esAdmin() || esOperador(); // supervisor solo ve
  const puedeSubirImg = puedeSubirImagenes(esAdmin(), esSupervisor());

  const headers = useMemo(() => {
    const token = obtenerToken();
    return { Authorization: `Bearer ${token}` };
  }, []);

  const cargarTodo = useCallback(async () => {
    setCargando(true);
    setMensaje("");
    try {
      const [respProd, respCat] = await Promise.all([
        api.get("/productos", { headers }),
        api.get("/categorias", { headers }),
      ]);

      setProductos(respProd.data.productos || []);
      setCategorias(respCat.data.categorias || []);
      // set default categoria en el formulario
      if ((respCat.data.categorias || []).length > 0) {
        setForm((prev) => ({ ...prev, id_categoria: respCat.data.categorias[0].id_categoria }));
      }
    } catch (e: any) {
      setMensaje(<><span className="material-symbols-outlined">error</span> No se pudo cargar productos/categorías. Revisa el token o el backend.</>);
    } finally {
      setCargando(false);
    }
  }, [headers]);

  useEffect(() => {
    cargarTodo();
  }, [cargarTodo]);

  const productosFiltrados = useMemo(() => {
    return productos.filter((p) => {
      const coincideTexto =
        p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        (p.descripcion || "").toLowerCase().includes(busqueda.toLowerCase());

      const coincideCategoria =
        filtroCategoria === "todas" ? true : p.id_categoria === filtroCategoria;

      return coincideTexto && coincideCategoria;
    });
  }, [productos, busqueda, filtroCategoria]);

  const abrirCrear = () => {
    setEditando(false);
    setForm({
      nombre: "",
      descripcion: "",
      precio: "",
      stock: 0,
      id_categoria: categorias[0]?.id_categoria || 1,
      id_subcategoria: "ninguna",
      imagen: null,
    });
    setMensaje("");
    setModalAbierto(true);
  };

  const handleCrearNuevoConIA = (datosIA: any) => {
    abrirCrear();
    setForm(prev => ({
      ...prev,
      nombre: datosIA.marca ? `${datosIA.marca} ${datosIA.tipo_licor || ''}`.trim() : (datosIA.tipo_licor || ""),
      descripcion: `${datosIA.volumen_ml ? datosIA.volumen_ml + 'ml - ' : ''}${datosIA.descripcion_visual || ''}`,
    }));
  };

  const abrirEditar = (p: Producto) => {
    setEditando(true);
    setForm({
      id_producto: p.id_producto,
      nombre: p.nombre,
      descripcion: p.descripcion,
      precio: p.precio,
      stock: p.stock,
      id_categoria: p.id_categoria,
      id_subcategoria: p.id_subcategoria || "ninguna",
      imagen: p.imagen || null,
    });
    setMensaje("");
    setModalAbierto(true);
  };

  const guardar = async () => {
    setMensaje("");
    try {
      if (!puedeEditar) {
        setMensaje(<><span className="material-symbols-outlined">block</span> Supervisor no puede crear/editar.</>);
        return;
      }

      if (!form.nombre || !form.precio) {
        setMensaje(<><span className="material-symbols-outlined">warning</span> Nombre y precio son obligatorios.</>);
        return;
      }

      if (editando && form.id_producto) {
        // EDITAR (PUT)
        await api.put(
          `/productos/${form.id_producto}`,
          {
            nombre: form.nombre,
            descripcion: form.descripcion,
            precio: Number(form.precio),
            stock: Number(form.stock),
            id_categoria: Number(form.id_categoria),
            id_subcategoria: form.id_subcategoria === "ninguna" ? null : Number(form.id_subcategoria),
            imagen: form.imagen || null,
          },
          { headers }
        );
        setMensaje(<><span className="material-symbols-outlined">check_circle</span> Producto actualizado</>);
      } else {
        // CREAR (POST)
        await api.post(
          "/productos",
          {
            nombre: form.nombre,
            descripcion: form.descripcion,
            precio: Number(form.precio),
            stock: Number(form.stock),
            id_categoria: Number(form.id_categoria),
            id_subcategoria: form.id_subcategoria === "ninguna" ? null : Number(form.id_subcategoria),
            imagen: form.imagen || null,
          },
          { headers }
        );
        setMensaje(<><span className="material-symbols-outlined">check_circle</span> Producto creado</>);
      }

      setModalAbierto(false);
      await cargarTodo();
    } catch (e: any) {
      console.error("Error al guardar producto:", e);

      if (e?.response?.status === 403) {
        setMensaje(<><span className="material-symbols-outlined">block</span> No tienes permisos para esta acción.</>);
      } else if (e?.response?.data?.mensaje) {
        setMensaje(<><span className="material-symbols-outlined">error</span> {e.response.data.mensaje}</>);
      } else if (e?.response?.status) {
        setMensaje(<><span className="material-symbols-outlined">error</span> Error {e.response.status}: {e.response.statusText}</>);
      } else if (e?.message) {
        setMensaje(<><span className="material-symbols-outlined">error</span> {e.message}</>);
      } else {
        setMensaje(<><span className="material-symbols-outlined">error</span> Error al guardar. Verifica que el backend esté corriendo en http://localhost:3000</>);
      }
    }
  };

  const desactivar = async (p: Producto) => {
    setMensaje("");
    try {
      if (!puedeEditar) {
        setMensaje(<><span className="material-symbols-outlined">block</span> Supervisor no puede desactivar.</>);
        return;
      }

      await api.delete(`/productos/${p.id_producto}`, { headers });


      setMensaje(<><span className="material-symbols-outlined">check_circle</span> Producto desactivado</>);
      await cargarTodo();
    } catch (e: any) {
      if (e?.response?.status === 403) {
        setMensaje(<><span className="material-symbols-outlined">block</span> No tienes permisos para esta acción.</>);
      } else {
        setMensaje(<><span className="material-symbols-outlined">error</span> Error al desactivar. Revisa el backend.</>);
      }
    }
  };


  const activar = async (p: Producto) => {
    setMensaje("");
    try {
      if (!puedeEditar) {
        setMensaje(<><span className="material-symbols-outlined">block</span> Supervisor no puede activar.</>);
        return;
      }

      await api.patch(`/productos/${p.id_producto}/activar`, {}, { headers });

      setMensaje(<><span className="material-symbols-outlined">check_circle</span> Producto activado</>);
      await cargarTodo();
    } catch (e: any) {
      if (e?.response?.status === 403) {
        setMensaje(<><span className="material-symbols-outlined">block</span> No tienes permisos para esta acción.</>);
      } else {
        setMensaje(<><span className="material-symbols-outlined">error</span> Error al activar. Revisa el backend.</>);
      }
    }
  };

  const eliminarDefinitivo = async (p: Producto) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar permanentemente el producto "${p.nombre}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    setMensaje("");
    try {
      if (!esAdmin()) {
        setMensaje(<><span className="material-symbols-outlined">block</span> Solo el Administrador puede eliminar definitivamente.</>);
        return;
      }

      const resp = await api.delete(`/productos/${p.id_producto}/definitivo`, { headers });
      setMensaje(<><span className="material-symbols-outlined">check_circle</span> {resp.data.mensaje || "Producto eliminado definitivamente"}</>);
      await cargarTodo();
    } catch (e: any) {
      if (e?.response?.status === 403) {
        setMensaje(<><span className="material-symbols-outlined">block</span> No tienes permisos para esta acción.</>);
      } else if (e?.response?.data?.mensaje) {
        setMensaje(<><span className="material-symbols-outlined">error</span> {e.response.data.mensaje}</>);
      } else {
        setMensaje(<><span className="material-symbols-outlined">error</span> Error al eliminar. Revisa el backend.</>);
      }
    }
  };


  return (
    <div className="card">
      <div className="seccion-header">
        <div className="seccion-header-info">
          <h1 className="ocultar-movil">Productos</h1>
          <div className="badge">
            <span className="material-symbols-outlined">liquor</span>
            <span>Catálogo de Licores y Bebidas</span>
            <span className="pill">
              {esSupervisor() ? "Solo lectura" : "Edición habilitada"}
            </span>
          </div>
        </div>

        <button className="btn-salir" onClick={volver}>
          Volver
        </button>
      </div>

      <div className="filtros">
        <div className="input-busqueda">
          <input
            className="input"
            style={{ marginBottom: 0 }}
            placeholder="Buscar..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <button
            className="btn-ia"
            onClick={() => setMostrarReconocimiento(true)}
            title="IA Reconocimiento"
          >
            <span className="material-symbols-outlined">photo_camera</span>
            <span className="ocultar-movil">IA</span>
          </button>
        </div>

        <select
          className="select"
          value={filtroCategoria}
          onChange={(e) =>
            setFiltroCategoria(e.target.value === "todas" ? "todas" : Number(e.target.value))
          }
        >
          <option value="todas">Categorías</option>
          {categorias.map((c) => (
            <option key={c.id_categoria} value={c.id_categoria}>
              {c.nombre}
            </option>
          ))}
        </select>

        <div className="acciones">
          {puedeEditar && (
            <>
              <button className="btn-secundario btn-icono" onClick={() => setModalImportarAbierto(true)}>
                <span className="material-symbols-outlined">publish</span>
                <span className="ocultar-movil">Importar</span>
              </button>
              <button className="btn-primario" onClick={abrirCrear}>
                <span className="material-symbols-outlined">add</span>
                <span className="ocultar-tablet">Nuevo</span>
              </button>
            </>
          )}

          <button className="btn-secundario btn-icono" onClick={cargarTodo} title="Recargar">
            <span className="material-symbols-outlined">refresh</span>
          </button>
        </div>
      </div>

      {cargando ? (
        <div className="loading">Cargando productos...</div>
      ) : (
        <div className="tabla-contenedor">
          <table className="tabla">
            <thead>
              <tr>
                <th style={{ width: 60 }}>Img</th>
                <th>Producto</th>
                <th className="ocultar-movil">Categoría</th>
                <th>Precio</th>
                <th className="ocultar-tablet">Stock</th>
                <th className="ocultar-movil">Estado</th>
                <th style={{ width: 120 }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {productosFiltrados.map((p) => (
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
                      <div className="tabla-imagen-placeholder material-symbols-outlined">
                        liquor
                      </div>
                    )}
                  </td>
                  <td>
                    <div className="producto-celda">
                      <b className="truncar" style={{ maxWidth: 150 }}>{p.nombre}</b>
                      <div className="ocultar-movil" style={{ color: "#94a3b8", fontSize: 12 }}>{p.descripcion?.substring(0, 30)}...</div>
                    </div>
                  </td>
                  <td className="ocultar-movil">
                    <div style={{ fontWeight: 500, fontSize: 13 }}>
                      {p.categoria || categorias.find(c => c.id_categoria === p.id_categoria)?.nombre}
                    </div>
                  </td>
                  <td><div className="precio-tag">$ {Number(p.precio).toFixed(2)}</div></td>
                  <td className="ocultar-tablet">
                    <span className={`stock-badge ${p.stock <= 5 ? 'bajo' : ''}`}>
                      {p.stock}
                    </span>
                  </td>
                  <td className="ocultar-movil">
                    <span className={`pill ${p.activo ? 'exito' : 'error'}`}>
                      {p.activo ? "Activo" : "Off"}
                    </span>
                  </td>
                  <td>
                    <div className="acciones-compactas">
                      <button 
                        className={`btn-icon-alt ${p.activo ? 'activo' : 'inactivo'}`} 
                        onClick={() => p.activo ? desactivar(p) : activar(p)}
                        title={p.activo ? "Desactivar" : "Activar"}
                        disabled={!puedeEditar}
                      >
                        <span className="material-symbols-outlined">
                          {p.activo ? "visibility" : "visibility_off"}
                        </span>
                      </button>
                      <button className="btn-icon-alt" onClick={() => abrirEditar(p)} disabled={!puedeEditar}>
                        <span className="material-symbols-outlined">edit</span>
                      </button>
                      {esAdmin() && (
                        <button className="btn-icon-alt peligro" onClick={() => eliminarDefinitivo(p)}>
                          <span className="material-symbols-outlined">delete</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {productosFiltrados.length === 0 && (
                <tr>
                  <td colSpan={7} className="loading">
                    No hay productos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {mensaje && <div className="mensaje">{mensaje}</div>}

      {/* MODAL */}
      {modalAbierto && (
        <div className="modal-fondo" onClick={() => setModalAbierto(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editando ? "Editar producto" : "Nuevo producto"}</h3>

            <div className="form-grid">
              <div className="campo full">
                <label className="label">Nombre del Producto</label>
                <input
                  className="input"
                  placeholder="Nombre"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                />
              </div>

              <div className="campo full">
                <label className="label">Descripción</label>
                <input
                  className="input"
                  placeholder="Descripción (Escriba aquí la Marca, Volumen en ml, Grado Alcohólico)"
                  value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                />
              </div>

              <div className="campo">
                <label className="label">Precio ($)</label>
                <input
                  className="input"
                  placeholder="Precio"
                  value={form.precio}
                  onChange={(e) => setForm({ ...form, precio: e.target.value })}
                />
              </div>

              <div className="campo">
                <label className="label">Stock Actual</label>
                <input
                  className="input"
                  placeholder="Stock"
                  type="number"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
                />
              </div>

              <div className="campo">
                <label className="label">Categoría</label>
                <select
                  className="select"
                  value={form.id_categoria}
                  onChange={(e) => {
                    const newId = Number(e.target.value);
                    setForm({ ...form, id_categoria: newId, id_subcategoria: "ninguna" });
                  }}
                >
                  {categorias.map((c) => (
                    <option key={c.id_categoria} value={c.id_categoria}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="campo">
                <label className="label">Subcategoría (Opcional)</label>
                <select
                  className="select"
                  value={form.id_subcategoria}
                  onChange={(e) => setForm({ ...form, id_subcategoria: e.target.value === "ninguna" ? "ninguna" : Number(e.target.value) })}
                >
                  <option value="ninguna">Sin subcategoría</option>
                  {categorias.find(c => c.id_categoria === Number(form.id_categoria))?.subcategorias?.map((s: any) => (
                    <option key={s.id_subcategoria} value={s.id_subcategoria}>
                      {s.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="campo full">
                <label className="label">URL de Imagen</label>
                <input
                  className="input"
                  placeholder="URL de imagen (opcional)"
                  value={form.imagen || ""}
                  onChange={(e) => setForm({ ...form, imagen: e.target.value || null })}
                />
              </div>

              {form.imagen && (
                <div className="full" style={{ marginTop: 8 }}>
                  <img
                    src={form.imagen}
                    alt="Vista previa"
                    style={{
                      maxWidth: "100%",
                      maxHeight: 200,
                      borderRadius: 4,
                      border: "1px solid #334155",
                    }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              )}

              <div className="full" style={{ marginTop: 8 }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      try {
                        const resultado = await convertirImagenABase64(file);
                        if (resultado) {
                          setForm({ ...form, imagen: resultado as string });
                        }
                      } catch (error) {
                        setMensaje(`❌ ${(error as Error).message}`);
                      }
                    }
                  }}
                  style={{ color: "#cbd5e1" }}
                  disabled={!puedeSubirImg}
                />
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                  {puedeSubirImg
                    ? "JPG, PNG o WebP (máximo 5MB)"
                    : <><span className="material-symbols-outlined">warning</span> Solo Admin y Supervisor pueden subir imágenes</>}
                </div>
              </div>
            </div>

            <div className="fila" style={{ justifyContent: "flex-end", marginTop: 14 }}>
              <button className="btn-secundario" onClick={() => setModalAbierto(false)}>
                Cancelar
              </button>
              <button className="btn-primario" onClick={guardar}>
                Guardar
              </button>
            </div>

            <div className="mensaje" style={{ marginTop: 10, color: "#cbd5e1" }}>
              {esSupervisor()
                ? "Supervisor: solo lectura."
                : "Admin/Operador: pueden crear, editar y activar/desactivar."}
            </div>
          </div>
        </div>
      )}

      {/* MODAL IA */}
      {mostrarReconocimiento && (
        <ReconocimientoBotella
          onCerrar={() => setMostrarReconocimiento(false)}
          onSeleccionarProducto={(id) => {
            const prod = productos.find(p => p.id_producto === id);
            if (prod) abrirEditar(prod);
          }}
          onCrearNuevo={handleCrearNuevoConIA}
        />
      )}

      {/* MODAL IMPORTACIÓN MASIVA */}
      {modalImportarAbierto && (
        <ModalImportarMasivo
          onCerrar={() => setModalImportarAbierto(false)}
          onImportado={cargarTodo}
          categorias={categorias}
          headers={headers}
        />
      )}
    </div>
  );
};

export default Productos;
