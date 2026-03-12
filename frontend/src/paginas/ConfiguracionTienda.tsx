import { useState, useEffect } from "react";
import { obtenerConfiguracionTienda, actualizarConfiguracionTienda, obtenerCategoriasTienda, type ConfiguracionTienda, type Categoria } from "../api/tienda";
import { obtenerToken } from "../api/autenticacion";
import "../estilos/dashboard.css";

const Icon = ({ name, style = {} }: { name: string; style?: React.CSSProperties }) => (
    <span className="material-symbols-outlined" style={style}>{name}</span>
);

const configuracionDefecto: ConfiguracionTienda = {
    telefono: "0123-456-789",
    email: "contacto@sierrastock.com",
    heroSlides: [
        { titulo: "CRAFT BEER", subtitulo: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.", boton: "SEE MORE" },
        { titulo: "PREMIUM WHISKY", subtitulo: "Descubre nuestra colección exclusiva de whiskies.", boton: "EXPLORAR" },
        { titulo: "FINE WINES", subtitulo: "Los mejores vinos de las bodegas más prestigiosas.", boton: "VER MÁS" }
    ],
    navLinks: ["NUEVOS", "ESPECIALES", "BEST SELLERS"],
    banners: [
        { label: "NUEVA CATEGORÍA", desc: "LOREM IPSUM DOLOR SIT AMET" },
        { label: "NUEVA CATEGORÍA", desc: "LOREM IPSUM DOLOR SIT AMET" },
        { label: "NUEVA CATEGORÍA", desc: "LOREM IPSUM DOLOR SIT AMET" }
    ]
};

const ConfiguracionTiendaPage = ({ volver }: { volver: () => void }) => {
    const [config, setConfig] = useState<ConfiguracionTienda>(configuracionDefecto);
    const [categorias, setCategorias] = useState<Categoria[]>([]);
    const [cargando, setCargando] = useState(true);
    const [procesando, setProcesando] = useState(false);
    const [mensaje, setMensaje] = useState<{ texto: React.ReactNode; tipo: "exito" | "error" } | null>(null);

    useEffect(() => {
        cargarConfig();
    }, []);

    const cargarConfig = async () => {
        setCargando(true);
        try {
            const [resp, catResp] = await Promise.all([
                obtenerConfiguracionTienda(),
                obtenerCategoriasTienda()
            ]);
            if (resp.ok && resp.configuracion) {
                setConfig(resp.configuracion);
            }
            if (catResp.ok) {
                setCategorias(catResp.categorias || []);
            }
        } catch (e) {
            console.error("Error al cargar la configuración");
        } finally {
            setCargando(false);
        }
    };

    const mostrarMensaje = (texto: React.ReactNode, tipo: "exito" | "error") => {
        setMensaje({ texto, tipo });
        setTimeout(() => setMensaje(null), 3000);
    };

    const handleGuardar = async () => {
        setProcesando(true);
        try {
            const token = obtenerToken();
            if (!token) throw new Error("No estás autenticado");

            const resp = await actualizarConfiguracionTienda(config, token);
            if (resp.ok) {
                mostrarMensaje(
                    <>
                        <span className="material-symbols-outlined" style={{ verticalAlign: "middle", marginRight: 4 }}>check_circle</span>
                        {resp.mensaje}
                    </>,
                    "exito"
                );
            }
        } catch (error: any) {
            mostrarMensaje(
                <>
                    <span className="material-symbols-outlined" style={{ verticalAlign: "middle", marginRight: 4 }}>error</span>
                    Error al guardar configuración
                </>,
                "error"
            );
        } finally {
            setProcesando(false);
        }
    };

    const handleSlideChange = (index: number, key: string, value: any) => {
        const nuevosSlides = [...config.heroSlides];
        nuevosSlides[index] = { ...nuevosSlides[index], [key]: value };
        setConfig({ ...config, heroSlides: nuevosSlides });
    };

    if (cargando) {
        return (
            <div className="card">
                <div className="loading">Cargando configuración...</div>
            </div>
        );
    }

    return (
        <div className="card">
            <div className="topbar" style={{ marginBottom: "var(--espaciado-md)" }}>
                <div>
                    <h1 style={{ margin: 0 }}>Editar Tienda Principal</h1>
                    <div className="badge">
                        <span className="material-symbols-outlined">storefront</span>
                        <span>Configuración visual de la tienda pública</span>
                        <span className="pill primario">Solo Administrador</span>
                    </div>
                </div>
                <button className="btn-salir" onClick={volver}>
                    ← Volver
                </button>
            </div>

            {mensaje && (
                <div className={`mensaje ${mensaje.tipo}`} style={{ marginBottom: "var(--espaciado-md)" }}>
                    {mensaje.texto}
                </div>
            )}

            {/* Información de Contacto */}
            <h3 style={{ marginTop: 24, marginBottom: 16 }}>Información de Contacto</h3>
            <div className="form-grid">
                <div className="campo">
                    <label className="label">Teléfono</label>
                    <input
                        className="input"
                        value={config.telefono}
                        onChange={(e) => setConfig({ ...config, telefono: e.target.value })}
                        placeholder="Ej: 0123-456-789"
                    />
                </div>
                <div className="campo">
                    <label className="label">Correo Electrónico</label>
                    <input
                        className="input"
                        value={config.email}
                        onChange={(e) => setConfig({ ...config, email: e.target.value })}
                        placeholder="Ej: contacto@sierrastock.com"
                    />
                </div>
            </div>

            {/* Hero Slides */}
            <h3 style={{ marginTop: 32, marginBottom: 16 }}>Slides del Banner Principal (Hero)</h3>
            {config.heroSlides.map((slide, index) => (
                <div key={index} style={{ marginBottom: 24, padding: 16, border: "1px solid var(--color-borde)", borderRadius: 8, background: "var(--color-fondo)" }}>
                    <h4 style={{ marginTop: 0, marginBottom: 12 }}>Slide {index + 1}</h4>
                    <div className="form-grid">
                        <div className="campo" style={{ gridColumn: "span 2" }}>
                            <label className="label">Título</label>
                            <input
                                className="input"
                                value={slide.titulo}
                                onChange={(e) => handleSlideChange(index, "titulo", e.target.value)}
                            />
                        </div>
                        <div className="campo" style={{ gridColumn: "span 2" }}>
                            <label className="label">Subtítulo</label>
                            <textarea
                                className="input"
                                rows={2}
                                value={slide.subtitulo}
                                onChange={(e) => handleSlideChange(index, "subtitulo", e.target.value)}
                            />
                        </div>
                        <div className="campo" style={{ gridColumn: "span 2" }}>
                            <label className="label">Texto del Botón</label>
                            <input
                                className="input"
                                value={slide.boton}
                                onChange={(e) => handleSlideChange(index, "boton", e.target.value)}
                            />
                        </div>
                        <div className="campo" style={{ gridColumn: "span 2" }}>
                            <label className="label">Categoría vinculada (Opcional)</label>
                            <select
                                className="input"
                                value={slide.id_categoria || ""}
                                onChange={(e) => handleSlideChange(index, "id_categoria", e.target.value ? Number(e.target.value) : undefined)}
                            >
                                <option value="">Ninguna - Solo decorativo</option>
                                {categorias.map(cat => (
                                    <option key={cat.id_categoria} value={cat.id_categoria}>
                                        {cat.nombre}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="campo" style={{ gridColumn: "span 2" }}>
                            <label className="label">Imagen de Fondo</label>
                            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                                <div
                                    style={{
                                        width: 120,
                                        height: 60,
                                        backgroundColor: '#333',
                                        borderRadius: 4,
                                        overflow: 'hidden',
                                        border: '1px solid var(--color-borde)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    {slide.imagen ? (
                                        <img src={slide.imagen} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <span className="material-symbols-outlined" style={{ color: '#666' }}>image</span>
                                    )}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                const reader = new FileReader();
                                                reader.onloadend = () => {
                                                    handleSlideChange(index, "imagen", reader.result as string);
                                                };
                                                reader.readAsDataURL(file);
                                            }
                                        }}
                                        style={{ display: 'none' }}
                                        id={`hero-img-${index}`}
                                    />
                                    <label
                                        htmlFor={`hero-img-${index}`}
                                        className="btn-secundario btn-sm"
                                        style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}
                                    >
                                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>upload</span>
                                        Cambiar Imagen
                                    </label>
                                    {slide.imagen && (
                                        <button
                                            className="btn-texto btn-sm"
                                            style={{ color: 'var(--color-error)', marginLeft: 12 }}
                                            onClick={() => handleSlideChange(index, "imagen", undefined)}
                                        >
                                            Eliminar
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ))}

            {/* Enlaces de Navegación */}
            <h3 style={{ marginTop: 32, marginBottom: 16 }}>Enlaces de Navegación (Superior)</h3>
            <div style={{ padding: 16, border: "1px solid var(--color-borde)", borderRadius: 8, background: "var(--color-fondo)" }}>
                <p style={{ color: "var(--color-texto-muted)", marginBottom: 16, fontSize: "0.9rem" }}>
                    Esta es la vista previa de cómo aparecerán los enlaces en la barra principal de tu tienda.
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {/* ENLACE FIJO: INICIO */}
                    <div style={{ display: "flex", gap: "var(--espaciado-sm)", alignItems: "center", opacity: 0.7 }}>
                        <div className="input" style={{ flex: 1, background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <span>INICIO</span>
                            <span className="pill" style={{ fontSize: "10px", background: "var(--color-primario)", color: "white" }}>SISTEMA</span>
                        </div>
                        <div style={{ width: "38px" }}></div>
                    </div>

                    {/* ENLACES AUTOMÁTICOS: CATEGORÍAS */}
                    {categorias.filter(c => c.activo).map((cat) => (
                        <div key={cat.id_categoria} style={{ display: "flex", gap: "var(--espaciado-sm)", alignItems: "center", opacity: 0.7 }}>
                            <div className="input" style={{ flex: 1, background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <span>{cat.nombre.toUpperCase()}</span>
                                <span className="pill" style={{ fontSize: "10px", background: "#334155", color: "#cbd5e1" }}>CATEGORÍA</span>
                            </div>
                            <div style={{ width: "38px" }}></div>
                        </div>
                    ))}

                    {/* ENLACES MANUALES: EDITABLES */}
                    {(config.navLinks || configuracionDefecto.navLinks || []).map((link, index) => (
                        <div key={index} style={{ display: "flex", gap: "var(--espaciado-sm)", marginBottom: "0" }}>
                            <input
                                className="input"
                                value={link}
                                onChange={(e) => {
                                    const currentLinks = config.navLinks || configuracionDefecto.navLinks || [];
                                    const newLinks = [...currentLinks];
                                    newLinks[index] = e.target.value.toUpperCase();
                                    setConfig({ ...config, navLinks: newLinks });
                                }}
                                placeholder="Ej. PROMOCIONES"
                                style={{ flex: 1, border: "1px solid var(--color-primario)" }}
                            />
                            <button
                                className="btn-peligro btn-sm"
                                onClick={() => {
                                    const currentLinks = config.navLinks || configuracionDefecto.navLinks || [];
                                    const newLinks = currentLinks.filter((_, i) => i !== index);
                                    setConfig({ ...config, navLinks: newLinks });
                                }}
                                style={{ padding: "8px" }}
                                title="Eliminar enlace"
                            >
                                <span className="material-symbols-outlined">delete</span>
                            </button>
                        </div>
                    ))}
                </div>

                <div style={{ marginTop: "20px", borderTop: "1px solid var(--color-borde)", paddingTop: "15px" }}>
                    <button
                        className="btn-secundario btn-sm"
                        onClick={() => {
                            const currentLinks = config.navLinks || configuracionDefecto.navLinks || [];
                            setConfig({ ...config, navLinks: [...currentLinks, "NUEVO ENLACE"] });
                        }}
                    >
                        <span className="material-symbols-outlined" style={{ verticalAlign: "middle", marginRight: 4, fontSize: 18 }}>add</span>
                        Añadir enlace manual (Personalizado)
                    </button>
                    <p style={{ marginTop: "10px", fontSize: "0.8rem", color: "var(--color-texto-muted)" }}>
                        <Icon name="info" style={{ fontSize: "14px", verticalAlign: "middle", marginRight: "4px" }} />
                        Los enlaces marcados como <b>SISTEMA</b> o <b>CATEGORÍA</b> se gestionan automáticamente.
                    </p>
                </div>
            </div>

            {/* Banners de Categorías */}
            <h3 style={{ marginTop: 32, marginBottom: 16 }}>Banners de Categorías (Inicio - Los 3 cuadros superiores)</h3>
            <div className="form-grid">
                {(config.banners || configuracionDefecto.banners || []).map((banner, index) => (
                    <div key={index} style={{ marginBottom: 24, padding: 16, border: "1px solid var(--color-borde)", borderRadius: 8, background: "var(--color-fondo)", gridColumn: "span 2" }}>
                        <h4 style={{ marginTop: 0, marginBottom: 12 }}>Banner {index + 1}</h4>
                        <div className="campo">
                            <label className="label">Etiqueta (Roja)</label>
                            <input
                                className="input"
                                value={banner.label}
                                onChange={(e) => {
                                    const currentBanners = config.banners || configuracionDefecto.banners || [];
                                    const newBanners = [...currentBanners];
                                    newBanners[index] = { ...newBanners[index], label: e.target.value.toUpperCase() };
                                    setConfig({ ...config, banners: newBanners });
                                }}
                                placeholder="Ej. NUEVA CATEGORÍA"
                            />
                        </div>
                        <div className="campo" style={{ marginTop: 12 }}>
                            <label className="label">Descripción</label>
                            <input
                                className="input"
                                value={banner.desc}
                                onChange={(e) => {
                                    const currentBanners = config.banners || configuracionDefecto.banners || [];
                                    const newBanners = [...currentBanners];
                                    newBanners[index] = { ...newBanners[index], desc: e.target.value.toUpperCase() };
                                    setConfig({ ...config, banners: newBanners });
                                }}
                                placeholder="Ej. LOREM IPSUM DOLOR SIT AMET"
                            />
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ marginTop: 24 }}>
                <button className="btn-primario" onClick={handleGuardar} disabled={procesando} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="material-symbols-outlined">save</span>
                    {procesando ? "Guardando..." : "Guardar Cambios"}
                </button>
            </div>
        </div>
    );
};

export default ConfiguracionTiendaPage;
