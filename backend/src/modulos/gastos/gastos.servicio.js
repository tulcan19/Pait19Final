const gastosRepositorio = require("./gastos.repositorio");

async function registrarGasto({ concepto, monto, observacion, categoria, id_usuario }) {
  if (!concepto || !String(concepto).trim()) return { ok: false, mensaje: "El concepto es obligatorio" };
  const montoNum = Number(monto);
  if (isNaN(montoNum) || montoNum <= 0) return { ok: false, mensaje: "El monto debe ser mayor a 0" };

  const gasto = await gastosRepositorio.crearGasto({
    concepto: String(concepto).trim(),
    monto: montoNum,
    observacion: observacion ? String(observacion).trim() : null,
    categoria: categoria ? String(categoria).trim() : null,
    id_usuario,
  });

  return { ok: true, gasto };
}

async function obtenerGastos() {
  const gastos = await gastosRepositorio.listarGastos();
  return { ok: true, gastos };
}

module.exports = {
  registrarGasto,
  obtenerGastos,
};
