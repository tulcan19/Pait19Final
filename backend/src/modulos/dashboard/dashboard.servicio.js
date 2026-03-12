const dashboardRepositorio = require("./dashboard.repositorio");

function calcularFechaDesde(periodo = "mes") {
  const ahora = new Date();

  switch (periodo) {
    case "dia": {
      const inicioHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
      return inicioHoy;
    }
    case "semana": {
      const inicioSemana = new Date(ahora);
      inicioSemana.setDate(ahora.getDate() - 7);
      return inicioSemana;
    }
    case "anio": {
      const inicioAnio = new Date(ahora.getFullYear(), 0, 1);
      return inicioAnio;
    }
    case "mes":
    default: {
      const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
      return inicioMes;
    }
  }
}

async function obtenerDashboard({ periodo = "mes" } = {}) {
  const desde = calcularFechaDesde(periodo);

  const resumen = await dashboardRepositorio.resumenTotales(desde);
  const populares = await dashboardRepositorio.productosPopulares(5, desde);
  const stockBajo = await dashboardRepositorio.stockBajo(5);
  const actividad = await dashboardRepositorio.actividadReciente(10, desde);
  const series = await dashboardRepositorio.seriesFinanzas(desde);

  return {
    ok: true,
    resumen,
    productos_populares: populares,
    stock_bajo: stockBajo,
    actividad_reciente: actividad,
    series,
    periodo,
    desde,
  };
}

module.exports = {
  obtenerDashboard,
};
