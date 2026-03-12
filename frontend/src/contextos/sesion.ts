export type Rol = "Administrador" | "Operador" | "Supervisor" | "Cliente";

export function obtenerUsuario() {
  const u = localStorage.getItem("usuario");
  return u ? JSON.parse(u) : null;
}

export function obtenerRol(): Rol | null {
  const u = obtenerUsuario();
  const raw = u?.rol;
  if (!raw) return null;
  if (typeof raw !== "string") return null;
  const norm = raw.trim().toLowerCase();
  if (norm === "administrador" || norm === "admin") return "Administrador";
  if (norm === "operador" || norm === "operator") return "Operador";
  if (norm === "supervisor" || norm === "super") return "Supervisor";
  if (norm === "cliente" || norm === "customer") return "Cliente";
  // fallback: try to capitalize
  const cap = norm.charAt(0).toUpperCase() + norm.slice(1);
  if (cap === "Administrador" || cap === "Operador" || cap === "Supervisor" || cap === "Cliente") return cap as Rol;
  return null;
}

export function esAdmin() {
  return obtenerRol() === "Administrador";
}

export function esOperador() {
  return obtenerRol() === "Operador";
}

export function esSupervisor() {
  return obtenerRol() === "Supervisor";
}

export function esCliente() {
  return obtenerRol() === "Cliente";
}
