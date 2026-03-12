const dashboardServicio = require("./dashboard.servicio");

async function ver(req, res) {
  try {
    const { periodo } = req.query;
    const resultado = await dashboardServicio.obtenerDashboard({ periodo });
    return res.json(resultado);
  } catch (error) {
    console.error("Error dashboard:", error);
    return res.status(500).json({ mensaje: "Error interno del servidor" });
  }
}

module.exports = {
  ver,
};
