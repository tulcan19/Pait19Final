const express = require("express");
const router = express.Router();
const chatbotControlador = require("./chatbot.controlador");
const { verificarToken } = require("../../middlewares/autenticacion.middleware");
const { permitirRoles } = require("../../middlewares/roles.middleware");

// Ruta exclusiva para clientes autenticados
router.post(
  "/preguntar",
  verificarToken,
  permitirRoles("Cliente"),
  chatbotControlador.preguntarChatbot
);

module.exports = router;
