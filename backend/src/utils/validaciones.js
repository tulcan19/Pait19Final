/**
 * Sistema de validación empresarial
 * Validaciones reutilizables y consistentes
 */

const { ErrorValidacion } = require('./manejoErrores');

/**
 * Valida email
 */
function validarEmail(email) {
  if (!email) return true; // Opcional
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!regex.test(email)) {
    throw new ErrorValidacion('Email inválido');
  }
  return true;
}

/**
 * Valida teléfono
 */
function validarTelefono(telefono) {
  if (!telefono) return true; // Opcional
  const regex = /^[\d\s\-\+\(\)]+$/;
  if (!regex.test(telefono) || telefono.length < 8) {
    throw new ErrorValidacion('Teléfono inválido');
  }
  return true;
}

/**
 * Valida coordenadas geográficas
 */
function validarCoordenadas(latitud, longitud) {
  // Si ambas son null o undefined, son opcionales
  if ((latitud === undefined || latitud === null) && (longitud === undefined || longitud === null)) {
    return true;
  }
  
  // Si una está definida pero la otra no, ambas deben estar definidas
  if ((latitud !== undefined && latitud !== null) && (longitud === undefined || longitud === null)) {
    throw new ErrorValidacion('Si se proporciona latitud, también debe proporcionarse longitud');
  }
  
  if ((longitud !== undefined && longitud !== null) && (latitud === undefined || latitud === null)) {
    throw new ErrorValidacion('Si se proporciona longitud, también debe proporcionarse latitud');
  }
  
  // Validar latitud si está presente
  if (latitud !== undefined && latitud !== null) {
    const lat = parseFloat(latitud);
    if (isNaN(lat) || lat < -90 || lat > 90) {
      throw new ErrorValidacion('Latitud inválida. Debe estar entre -90 y 90');
    }
  }
  
  // Validar longitud si está presente
  if (longitud !== undefined && longitud !== null) {
    const lng = parseFloat(longitud);
    if (isNaN(lng) || lng < -180 || lng > 180) {
      throw new ErrorValidacion('Longitud inválida. Debe estar entre -180 y 180');
    }
  }
  
  return true;
}

/**
 * Valida que un campo sea requerido
 */
function requerido(valor, nombreCampo) {
  if (valor === undefined || valor === null || valor === '') {
    throw new ErrorValidacion(`${nombreCampo} es requerido`);
  }
  return true;
}

/**
 * Valida que un número sea positivo
 */
function numeroPositivo(valor, nombreCampo) {
  if (valor === undefined || valor === null) return true; // Opcional
  const num = Number(valor);
  if (isNaN(num) || num < 0) {
    throw new ErrorValidacion(`${nombreCampo} debe ser un número positivo`);
  }
  return true;
}

/**
 * Valida que un número sea entero positivo
 */
function enteroPositivo(valor, nombreCampo) {
  if (valor === undefined || valor === null) return true; // Opcional
  const num = Number(valor);
  if (!Number.isInteger(num) || num < 1) {
    throw new ErrorValidacion(`${nombreCampo} debe ser un entero positivo`);
  }
  return true;
}

/**
 * Valida longitud de string
 */
function longitudString(valor, min, max, nombreCampo) {
  if (!valor) return true; // Opcional
  const longitud = String(valor).length;
  if (min && longitud < min) {
    throw new ErrorValidacion(`${nombreCampo} debe tener al menos ${min} caracteres`);
  }
  if (max && longitud > max) {
    throw new ErrorValidacion(`${nombreCampo} no puede tener más de ${max} caracteres`);
  }
  return true;
}

/**
 * Valida que un valor esté en una lista de opciones
 */
function enLista(valor, opciones, nombreCampo) {
  if (!valor) return true; // Opcional
  if (!opciones.includes(valor)) {
    throw new ErrorValidacion(`${nombreCampo} debe ser uno de: ${opciones.join(', ')}`);
  }
  return true;
}

/**
 * Sanitiza string (elimina caracteres peligrosos)
 */
function sanitizarString(valor) {
  if (typeof valor !== 'string') return valor;
  return valor.trim().replace(/[<>]/g, '');
}

/**
 * Valida esquema de proveedor
 */
function validarProveedor(datos) {
  const { nombre, telefono, correo, producto, latitud, longitud } = datos;

  requerido(nombre, 'Nombre');
  longitudString(nombre, 2, 100, 'Nombre');
  
  if (telefono) {
    validarTelefono(telefono);
  }
  
  if (correo) {
    validarEmail(correo);
  }
  
  // Validar coordenadas solo si no son null (pueden ser undefined o valores válidos)
  if ((latitud !== undefined && latitud !== null) || (longitud !== undefined && longitud !== null)) {
    validarCoordenadas(latitud, longitud);
  }

  return true;
}

/**
 * Valida esquema de producto
 */
function validarProducto(datos) {
  const { nombre, precio, stock, categoria_id } = datos;

  requerido(nombre, 'Nombre');
  longitudString(nombre, 2, 200, 'Nombre');
  
  if (precio !== undefined) {
    numeroPositivo(precio, 'Precio');
  }
  
  if (stock !== undefined) {
    enteroPositivo(stock, 'Stock');
  }
  
  if (categoria_id !== undefined) {
    enteroPositivo(categoria_id, 'Categoría');
  }

  return true;
}

/**
 * Valida esquema de usuario
 */
function validarUsuario(datos) {
  const { nombre, correo, contrasena, rol } = datos;

  requerido(nombre, 'Nombre');
  longitudString(nombre, 2, 100, 'Nombre');
  
  requerido(correo, 'Correo');
  validarEmail(correo);
  
  if (contrasena) {
    longitudString(contrasena, 6, 100, 'Contraseña');
  }
  
  if (rol) {
    enLista(rol, ['Administrador', 'Operador', 'Supervisor', 'Vendedor'], 'Rol');
  }

  return true;
}

module.exports = {
  validarEmail,
  validarTelefono,
  validarCoordenadas,
  requerido,
  numeroPositivo,
  enteroPositivo,
  longitudString,
  enLista,
  sanitizarString,
  validarProveedor,
  validarProducto,
  validarUsuario,
};
