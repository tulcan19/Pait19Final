const { GoogleGenerativeAI } = require("@google/generative-ai");
const logger = require("../../utils/logger");

async function reconocerBotella(imagenBase64) {
    try {
        const currentApiKey = process.env.GEMINI_API_KEY;

        // If we only have a placeholder, return a mock response for testing until user provides key
        if (!currentApiKey || currentApiKey === "PLACEHOLDER_KEY") {
            logger.warn("Using mock Gemini response due to missing GEMINI_API_KEY in environment variables.");
            return {
                marca: "Johnnie Walker",
                tipo_licor: "Whisky",
                volumen_ml: "750",
                descripcion_visual: "Botella cuadrada, etiqueta negra, tapón negro"
            };
        }

        // Initialize the model with the current key
        const genAI = new GoogleGenerativeAI(currentApiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash"
        });

        // Detectar mimeType automáticamente desde el prefijo base64 si existe
        let mimeType = "image/jpeg";
        const matches = imagenBase64.match(/^data:([^;]+);base64,/);
        if (matches && matches.length > 1) {
            mimeType = matches[1];
        }

        // Ensure the base64 string doesn't have the data URL prefix if it was sent with one
        const base64Data = imagenBase64.replace(/^data:image\/\w+;base64,/, "");

        const prompt = `
      Analiza esta imagen de una botella de licor.
      Identifica y devuelve estrictamente un objeto JSON válido con las siguientes claves:
      - "marca": La marca principal del licor (ej: "Johnnie Walker", "Jose Cuervo"). Si no la sabes, pon null.
      - "tipo_licor": El tipo de bebida (ej: "Whisky", "Tequila", "Vino Tinto", "Cerveza").
      - "volumen_ml": El volumen aproximado en mililitros si es visible (ej: "750", "1000"). Si no, pon null.
      - "descripcion_visual": Una breve descripción de las características visuales (forma de botella, color de etiqueta).

      Responde SOLO con el JSON, sin texto de Markdown (\`\`\`json) alrededor.
    `;

        const imageParts = [
            {
                inlineData: {
                    data: base64Data,
                    mimeType: mimeType
                }
            }
        ];

        const result = await model.generateContent([prompt, ...imageParts]);
        const responseText = result.response.text();

        try {
            // Intentar parsear el JSON de la respuesta
            const cleanJson = responseText.replace(/```json\s?/g, '').replace(/```\s?/g, '').trim();
            const parsed = JSON.parse(cleanJson);
            return parsed;
        } catch (parseError) {
            logger.error("Error parseando respuesta de Gemini", { response: responseText });
            throw new Error(`Error al interpretar la respuesta de la IA: ${responseText}`);
        }

    } catch (error) {
        logger.error("Error en servicio de reconocimiento Gemini:", error);
        throw error;
    }
}

module.exports = {
    reconocerBotella
};
