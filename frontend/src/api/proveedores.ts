import api from "./api";

export type Proveedor = {
  id_proveedor?: number;
  nombre: string;
  producto: string;
  correo?: string;
  telefono?: string;
  latitud?: number | null;
  longitud?: number | null;
  activo?: boolean;
};

export async function listarProveedores(): Promise<Proveedor[]> {
  const resp = await api.get("/proveedores", {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
  });
  return resp.data.proveedores || [];
}

export async function crearProveedor(p: Proveedor) {
  const resp = await api.post("/proveedores", p, {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
  });
  return resp.data;
}

export async function editarProveedor(p: Proveedor) {
  const resp = await api.put(`/proveedores/${p.id_proveedor}`, p, {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
  });
  return resp.data;
}

export async function eliminarProveedor(id: number) {
  const resp = await api.delete(`/proveedores/${id}`, {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
  });
  return resp.data;
}

export async function cambiarEstadoProveedor(id: number, activo: boolean) {
  const endpoint = activo ? `/proveedores/${id}/activar` : `/proveedores/${id}`;
  const method = activo ? 'patch' : 'delete';

  const resp = await api[method](endpoint, {}, {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
  });
  return resp.data;
}

export async function eliminarProveedorDefinitivamente(id: number) {
  const resp = await api.delete(`/proveedores/${id}/eliminar`, {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
  });
  return resp.data;
}
