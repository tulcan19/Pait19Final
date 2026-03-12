/**
 * VALIDACIONES - SIERRA STOCK
 * Funciones de validación para el sistema
 */

// ============================================
// CONSTANTES
// ============================================
export const DOMINIO_PERMITIDO = "@sierrastock.com";
export const MIN_PASSWORD_LENGTH = 6;
export const MAX_TELEFONO_LENGTH = 15;
export const MIN_TELEFONO_LENGTH = 7;
export const CEDULA_LENGTH = 10; // Ecuador

// ============================================
// VALIDACIÓN DE CORREO
// ============================================
export const validarCorreo = (email: string, validarDominio = true): { valido: boolean; mensaje?: string } => {
  if (!email || !email.trim()) {
    return { valido: false, mensaje: "El correo es obligatorio" };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valido: false, mensaje: "Formato de correo inválido" };
  }

  if (validarDominio && !email.toLowerCase().endsWith(DOMINIO_PERMITIDO)) {
    return {
      valido: false,
      mensaje: `Solo se permiten correos con dominio ${DOMINIO_PERMITIDO}`
    };
  }

  return { valido: true };
};

// ============================================
// VALIDACIÓN DE CONTRASEÑA
// ============================================
export const validarContrasena = (password: string): { valido: boolean; mensaje?: string } => {
  if (!password) {
    return { valido: false, mensaje: "La contraseña es obligatoria" };
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      valido: false,
      mensaje: `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`
    };
  }

  return { valido: true };
};

// ============================================
// VALIDACIÓN DE CÉDULA ECUATORIANA
// ============================================
export const validarCedulaEcuador = (cedula: string): { valido: boolean; mensaje?: string } => {
  if (!cedula || !cedula.trim()) {
    return { valido: false, mensaje: "La cédula es obligatoria" };
  }

  // Remover espacios y guiones
  const cedulaLimpia = cedula.replace(/[\s-]/g, "");

  // Verificar longitud
  if (cedulaLimpia.length !== CEDULA_LENGTH) {
    return { valido: false, mensaje: `La cédula debe tener ${CEDULA_LENGTH} dígitos` };
  }

  // Verificar que solo contenga números
  if (!/^\d+$/.test(cedulaLimpia)) {
    return { valido: false, mensaje: "La cédula solo debe contener números" };
  }

  // Verificar código de provincia (01-24)
  const provincia = parseInt(cedulaLimpia.substring(0, 2), 10);
  if (provincia < 1 || provincia > 24) {
    return { valido: false, mensaje: "Código de provincia inválido" };
  }

  // Verificar tercer dígito (0-5 para personas naturales)
  const tercerDigito = parseInt(cedulaLimpia.charAt(2), 10);
  if (tercerDigito > 5) {
    return { valido: false, mensaje: "Tipo de cédula inválido" };
  }

  // Algoritmo de validación (módulo 10)
  const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  let suma = 0;

  for (let i = 0; i < 9; i++) {
    let valor = parseInt(cedulaLimpia.charAt(i), 10) * coeficientes[i];
    if (valor > 9) valor -= 9;
    suma += valor;
  }

  const digitoVerificador = (10 - (suma % 10)) % 10;
  const ultimoDigito = parseInt(cedulaLimpia.charAt(9), 10);

  if (digitoVerificador !== ultimoDigito) {
    return { valido: false, mensaje: "Cédula inválida (dígito verificador incorrecto)" };
  }

  return { valido: true };
};

// ============================================
// VALIDACIÓN DE TELÉFONO
// ============================================
export const validarTelefono = (telefono: string): { valido: boolean; mensaje?: string } => {
  if (!telefono || !telefono.trim()) {
    return { valido: true }; // Teléfono puede ser opcional
  }

  // Remover espacios, guiones, paréntesis
  const telefonoLimpio = telefono.replace(/[\s\-\(\)]/g, "");

  // Verificar que solo contenga números y opcionalmente un + al inicio
  if (!/^\+?\d+$/.test(telefonoLimpio)) {
    return { valido: false, mensaje: "El teléfono solo debe contener números" };
  }

  // Verificar longitud mínima
  const soloNumeros = telefonoLimpio.replace("+", "");
  if (soloNumeros.length < MIN_TELEFONO_LENGTH) {
    return {
      valido: false,
      mensaje: `El teléfono debe tener al menos ${MIN_TELEFONO_LENGTH} dígitos`
    };
  }

  // Verificar longitud máxima
  if (soloNumeros.length > MAX_TELEFONO_LENGTH) {
    return {
      valido: false,
      mensaje: `El teléfono no puede exceder ${MAX_TELEFONO_LENGTH} dígitos`
    };
  }

  return { valido: true };
};

// ============================================
// VALIDACIÓN DE NOMBRE
// ============================================
export const validarNombre = (nombre: string, minLength = 2, maxLength = 150): { valido: boolean; mensaje?: string } => {
  if (!nombre || !nombre.trim()) {
    return { valido: false, mensaje: "El nombre es obligatorio" };
  }

  const nombreTrim = nombre.trim();

  if (nombreTrim.length < minLength) {
    return {
      valido: false,
      mensaje: `El nombre debe tener al menos ${minLength} caracteres`
    };
  }

  if (nombreTrim.length > maxLength) {
    return {
      valido: false,
      mensaje: `El nombre no puede exceder ${maxLength} caracteres`
    };
  }

  // Verificar que no contenga solo números o caracteres especiales
  if (/^[\d\s\W]+$/.test(nombreTrim)) {
    return { valido: false, mensaje: "El nombre debe contener letras" };
  }

  return { valido: true };
};

// ============================================
// VALIDACIÓN DE MONTO/PRECIO
// ============================================
export const validarMonto = (
  monto: number | string,
  minimo = 0,
  maximo = 999999999
): { valido: boolean; mensaje?: string } => {
  const valor = typeof monto === "string" ? parseFloat(monto) : monto;

  if (isNaN(valor)) {
    return { valido: false, mensaje: "El monto debe ser un número válido" };
  }

  if (valor < minimo) {
    return { valido: false, mensaje: `El monto no puede ser menor a ${minimo}` };
  }

  if (valor > maximo) {
    return { valido: false, mensaje: `El monto no puede exceder ${maximo}` };
  }

  return { valido: true };
};

// ============================================
// VALIDACIÓN DE CANTIDAD/STOCK
// ============================================
export const validarCantidad = (
  cantidad: number | string,
  minimo = 1,
  maximo = 999999
): { valido: boolean; mensaje?: string } => {
  const valor = typeof cantidad === "string" ? parseInt(cantidad, 10) : cantidad;

  if (isNaN(valor)) {
    return { valido: false, mensaje: "La cantidad debe ser un número entero" };
  }

  if (!Number.isInteger(valor)) {
    return { valido: false, mensaje: "La cantidad debe ser un número entero" };
  }

  if (valor < minimo) {
    return { valido: false, mensaje: `La cantidad no puede ser menor a ${minimo}` };
  }

  if (valor > maximo) {
    return { valido: false, mensaje: `La cantidad no puede exceder ${maximo}` };
  }

  return { valido: true };
};

// ============================================
// FORMATEAR CÉDULA
// ============================================
export const formatearCedula = (cedula: string): string => {
  const limpia = cedula.replace(/\D/g, "");
  if (limpia.length <= 10) {
    return limpia;
  }
  return limpia.substring(0, 10);
};

// ============================================
// FORMATEAR TELÉFONO
// ============================================
export const formatearTelefono = (telefono: string): string => {
  const limpio = telefono.replace(/\D/g, "");

  // Formato Ecuador: 09X XXX XXXX
  if (limpio.length === 10 && limpio.startsWith("09")) {
    return `${limpio.slice(0, 3)} ${limpio.slice(3, 6)} ${limpio.slice(6)}`;
  }

  // Formato internacional
  if (limpio.length > 10) {
    return `+${limpio}`;
  }

  return limpio;
};

// ============================================
// FORMATEAR DINERO
// ============================================
export const formatearDinero = (valor: number | string, decimales = 2): string => {
  const num = typeof valor === "string" ? parseFloat(valor) : valor;
  if (isNaN(num)) return "0.00";
  return num.toLocaleString("es-EC", {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  });
};

// ============================================
// VALIDAR STOCK DISPONIBLE
// ============================================
export const validarStockDisponible = (
  stockActual: number,
  cantidadSolicitada: number
): { valido: boolean; mensaje?: string } => {
  if (cantidadSolicitada <= 0) {
    return { valido: false, mensaje: "La cantidad debe ser mayor a 0" };
  }

  if (cantidadSolicitada > stockActual) {
    return {
      valido: false,
      mensaje: `Stock insuficiente. Disponible: ${stockActual}`
    };
  }

  return { valido: true };
};

// ============================================
// GENERAR INICIALES
// ============================================
export const generarIniciales = (nombre: string): string => {
  if (!nombre) return "??";

  const palabras = nombre.trim().split(/\s+/);
  if (palabras.length === 1) {
    return palabras[0].substring(0, 2).toUpperCase();
  }

  return (palabras[0].charAt(0) + palabras[palabras.length - 1].charAt(0)).toUpperCase();
};
