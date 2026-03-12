export function obtenerToken(): string | null {
  return localStorage.getItem("token");
}

export function cerrarSesion() {
  localStorage.removeItem("token");
  localStorage.removeItem("usuario");
}
