import { useState, useEffect } from "react";
import { listarProveedores, cambiarEstadoProveedor, eliminarProveedorDefinitivamente, type Proveedor } from "../api/proveedores";

const TablaProveedores = () => {
    const [proveedores, setProveedores] = useState<Proveedor[]>([]);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        cargar();

        const handleRefresh = () => cargar();
        window.addEventListener("refreshProveedores", handleRefresh);
        return () => window.removeEventListener("refreshProveedores", handleRefresh);
    }, []);

    const cargar = async () => {
        try {
            const data = await listarProveedores();
            setProveedores(data);
        } catch (error) {
            console.error("Error cargando proveedores", error);
        } finally {
            setCargando(false);
        }
    };

    const handleToggleStatus = async (p: Proveedor) => {
        if (!p.id_proveedor) return;
        try {
            const nuevoEstado = !p.activo;
            await cambiarEstadoProveedor(p.id_proveedor, nuevoEstado);
            cargar();
        } catch (error) {
            console.error("Error al cambiar estado", error);
            alert("No se pudo cambiar el estado del proveedor");
        }
    };

    const handleEliminar = async (id: number) => {
        if (!window.confirm("¿Estás seguro de eliminar este proveedor definitivamente?")) return;
        try {
            await eliminarProveedorDefinitivamente(id);
            cargar();
        } catch (error) {
            console.error("Error al eliminar", error);
            alert("No se pudo eliminar el proveedor");
        }
    };

    if (cargando) return <div className="loading">Cargando proveedores...</div>;

    return (
        <div className="tabla-contenedor">
            <table className="tabla">
                <thead>
                    <tr>
                        <th>Nombre</th>
                        <th>Producto</th>
                        <th>Email</th>
                        <th>Teléfono</th>
                        <th>Ubicación</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {proveedores.map((p) => (
                        <tr key={p.id_proveedor}>
                            <td>{p.nombre}</td>
                            <td>{p.producto || "-"}</td>
                            <td>{p.correo || "-"}</td>
                            <td>{p.telefono || "-"}</td>
                            <td>
                                {p.latitud && p.longitud ? (
                                    <a
                                        href={`https://www.google.com/maps?q=${p.latitud},${p.longitud}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        style={{ color: "#2563eb", textDecoration: "underline" }}
                                    >
                                        Ver mapa
                                    </a>
                                ) : "-"}
                            </td>
                            <td>
                                <span className={`pill ${p.activo ? "exito" : "error"}`}>
                                    {p.activo ? "Activo" : "Inactivo"}
                                </span>
                            </td>
                            <td>
                                <div className="acciones">
                                    <button className="btn-secundario btn-sm">Editar</button>
                                    <button
                                        className={`btn-sm ${p.activo ? "btn-peligro" : "btn-exito"}`}
                                        onClick={() => handleToggleStatus(p)}
                                    >
                                        {p.activo ? "Desactivar" : "Activar"}
                                    </button>
                                    <button
                                        className="btn-peligro btn-sm"
                                        onClick={() => p.id_proveedor && handleEliminar(p.id_proveedor)}
                                    >
                                        Eliminar
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    {proveedores.length === 0 && (
                        <tr>
                            <td colSpan={6} style={{ textAlign: "center", padding: "1rem" }}>
                                No hay proveedores registrados.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default TablaProveedores;
