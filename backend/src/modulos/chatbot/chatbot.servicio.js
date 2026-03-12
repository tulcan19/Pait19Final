const https = require("https");
const logger = require("../../utils/logger");
const categoriasRepositorio = require("../categorias/categorias.repositorio");

async function obtenerRespuestaChatbot(mensajes) {
  return new Promise(async (resolve, reject) => {
    try {
      const apiKey = process.env.GROQ_API_KEY;

      if (!apiKey) {
        logger.error("GROQ_API_KEY no configurada en el entorno.");
        return reject(new Error("La clave de API de Groq no está configurada."));
      }

      // Obtener categorías dinámicamente de la base de datos
      let catalogoContexto = "";
      try {
        const categorias = await categoriasRepositorio.listarCategorias();
        if (categorias && categorias.length > 0) {
          catalogoContexto = "\n\nCatálogo actual de Sierra Stock:\n";
          categorias.forEach(cat => {
            catalogoContexto += `- Categoría: ${cat.nombre}.`;
            if (cat.subcategorias && cat.subcategorias.length > 0) {
              const nombresSub = cat.subcategorias.map(s => s.nombre_final || s.nombre).join(", ");
              catalogoContexto += ` Subcategorías: ${nombresSub}.`;
            }
            catalogoContexto += "\n";
          });
        }
      } catch (catError) {
        logger.error("Error al obtener categorías para el chatbot:", catError);
        // Continuamos sin las categorías si falla
      }

      // Prompt del sistema exclusivo para el rol de Cliente de Sierra Stock
      const systemPrompt = {
        role: "system",
        content: `Eres ChatBot19, el asistente virtual premium exclusivo de Sierra Stock.
        Tu objetivo es ayudar exclusivamente a los CLIENTES de la tienda de licores.
        
        Reglas fundamentales:
        1. Identidad: Eres ChatBot19.
        2. Enfoque: Solo respondes sobre productos de Sierra Stock, categorías, estados de pedidos y navegación básica de la tienda.
        3. Restricción de Rol: Estás aquí solo para servir al Cliente. No realices tareas administrativas ni brindes información interna del negocio.
        4. Restricción de Conocimiento: Si te preguntan sobre temas fuera de Sierra Stock, responde amablemente que solo puedes ayudar con temas de la tienda.
        5. Tono: Profesional, premium, servicial y elegante.
        
        ${catalogoContexto}
        
        Sierra Stock ofrece una amplia variedad de licores de alta gama. Siempre invita al cliente a explorar el catálogo si tiene dudas sobre qué elegir.`
      };

      const requestBody = JSON.stringify({
        messages: [systemPrompt, ...mensajes],
        model: "llama-3.3-70b-versatile",
      });

      const options = {
        hostname: "api.groq.com",
        path: "/openai/v1/chat/completions",
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(requestBody),
        },
        timeout: 30000
      };

      const req = https.request(options, (res) => {
        let responseData = "";

        res.on("data", (chunk) => {
          responseData += chunk;
        });

        res.on("end", () => {
          try {
            const parsed = JSON.parse(responseData);
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(parsed.choices[0]?.message?.content || "No recibí una respuesta válida.");
            } else {
              logger.error("Error de respuesta de Groq:", { statusCode: res.statusCode, body: parsed });
              reject(new Error(parsed.error?.message || `Error del servidor Groq: ${res.statusCode}`));
            }
          } catch (e) {
            logger.error("Error parseando JSON de Groq:", { error: e.message, body: responseData });
            reject(new Error("Error al interpretar la respuesta de la IA."));
          }
        });
      });

      req.on("error", (err) => {
        logger.error("Error en la solicitud HTTPS a Groq:", err);
        reject(err);
      });

      req.on("timeout", () => {
        req.destroy();
        reject(new Error("La solicitud a Groq ha superado el tiempo de espera."));
      });

      req.write(requestBody);
      req.end();

    } catch (globalError) {
      logger.error("Error global en obtenerRespuestaChatbot:", globalError);
      reject(globalError);
    }
  });
}

module.exports = {
  obtenerRespuestaChatbot,
};
