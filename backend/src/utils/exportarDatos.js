/**
 * Utilidades para exportar datos a diferentes formatos
 */

const logger = require('./logger');

/**
 * Exporta datos a formato CSV
 */
function exportarCSV(datos, columnas, nombreArchivo = 'exportacion') {
  try {
    // Encabezados
    const encabezados = columnas.map(col => col.titulo || col.campo).join(',');
    
    // Filas
    const filas = datos.map(fila => {
      return columnas.map(col => {
        const valor = fila[col.campo];
        // Escapar comillas y envolver en comillas si contiene comas
        if (valor === null || valor === undefined) return '';
        const valorStr = String(valor).replace(/"/g, '""');
        return valorStr.includes(',') ? `"${valorStr}"` : valorStr;
      }).join(',');
    });

    const csv = [encabezados, ...filas].join('\n');
    
    // Agregar BOM para Excel
    const BOM = '\uFEFF';
    return BOM + csv;
  } catch (error) {
    logger.error('Error exportando a CSV', { error: error.message });
    throw error;
  }
}

/**
 * Formatea datos para exportación
 */
function formatearParaExportacion(datos, formateadores = {}) {
  return datos.map(fila => {
    const filaFormateada = { ...fila };
    
    Object.keys(formateadores).forEach(campo => {
      if (filaFormateada[campo] !== undefined) {
        filaFormateada[campo] = formateadores[campo](filaFormateada[campo]);
      }
    });
    
    return filaFormateada;
  });
}

/**
 * Genera nombre de archivo con timestamp
 */
function generarNombreArchivo(prefijo, extension) {
  const fecha = new Date().toISOString().split('T')[0];
  const hora = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
  return `${prefijo}_${fecha}_${hora}.${extension}`;
}

module.exports = {
  exportarCSV,
  formatearParaExportacion,
  generarNombreArchivo,
};
