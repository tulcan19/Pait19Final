const express = require("express");
const router = express.Router();
const { identificarBotella } = require("./reconocimiento.controlador");
const { verificarToken } = require("../../middlewares/autenticacion.middleware");
// Protegemos la ruta para que solo usuarios autenticados puedan usarla
router.post("/identificar", verificarToken, identificarBotella);

module.exports = router;
