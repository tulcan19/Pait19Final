const chatbotServicio = require("./chatbot.servicio");
const logger = require("../../utils/logger");

async function preguntarChatbot(req, res, next) {
  try {
    const { mensajes } = req.body;

    if (!mensajes || !Array.isArray(mensajes)) {
      return res.status(400).json({
        ok: false,
        error: "Se requiere un array de mensajes."
      });
    }

    const respuesta = await chatbotServicio.obtenerRespuestaChatbot(mensajes);

    res.json({
      ok: true,
      respuesta
    });
  } catch (error) {
    logger.error("Error en preguntarChatbot controlador:", error);
    next(error);
  }
}

module.exports = {
  preguntarChatbot,
};
