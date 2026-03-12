import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

// API pública de tienda (sin autenticación)
const tiendaApi = axios.create({
    baseURL: `${API_BASE}/tienda`,
    timeout: 15000,
    headers: { "Content-Type": "application/json" },
});

export interface Producto {
    id_producto: number;
    nombre: string;
    descripcion: string;
    precio: number;
    stock: number;
    imagen: string | null;
    id_categoria: number;
    categoria_nombre: string;
}

export interface Categoria {
    id_categoria: number;
    nombre: string;
    descripcion: string | null;
    imagen: string | null;
    total_productos: number;
    subcategorias?: { id_subcategoria: number; nombre_final: string }[];
    activo?: boolean;
}

export interface ProductosResponse {
    ok: boolean;
    productos: Producto[];
    total: number;
    pagina: number;
    totalPaginas: number;
}

export async function obtenerProductosTienda(params?: {
    categoria?: number;
    busqueda?: string;
    limite?: number;
    pagina?: number;
}): Promise<ProductosResponse> {
    const { data } = await tiendaApi.get("/productos", { params });
    return data;
}

export async function obtenerProductoDetalle(id: number) {
    const { data } = await tiendaApi.get(`/productos/${id}`);
    return data;
}

export async function obtenerCategoriasTienda(): Promise<{ ok: boolean; categorias: Categoria[] }> {
    const { data } = await tiendaApi.get("/categorias");
    return data;
}

export async function obtenerDestacados(limite = 8): Promise<{ ok: boolean; productos: Producto[] }> {
    const { data } = await tiendaApi.get("/destacados", { params: { limite } });
    return data;
}

export interface SlideConfig {
    titulo: string;
    subtitulo: string;
    boton: string;
    id_categoria?: number;
    imagen?: string;
}

export interface BannerConfig {
    label: string;
    desc: string;
}

export interface ConfiguracionTienda {
    telefono: string;
    email: string;
    heroSlides: SlideConfig[];
    navLinks?: string[];
    banners?: BannerConfig[];
}

export async function obtenerConfiguracionTienda(): Promise<{ ok: boolean; configuracion: ConfiguracionTienda }> {
    const { data } = await tiendaApi.get("/configuracion");
    return data;
}

export async function actualizarConfiguracionTienda(config: ConfiguracionTienda, token: string): Promise<{ ok: boolean; mensaje: string }> {
    const { data } = await tiendaApi.put("/configuracion", config, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return data;
}
