const Groq = require('groq-sdk');
require('dotenv').config();

const GROQ_API_KEY = process.env.GROQ_API_KEY;

let groq;
try {
  groq = new Groq({ apiKey: GROQ_API_KEY });
  console.log('🤖 Groq AI SDK initialized successfully.');
} catch (error) {
  console.error('❌ Failed to initialize Groq SDK:', error);
}

/**
 * Builds the comprehensive system prompt including FAQs and company info
 */
function buildSystemPrompt(site) {
  let prompt = `${site.systemPrompt || "Eres un asistente virtual de soporte amable y profesional."}\n\n`;
  
  prompt += `INFORMACIÓN DE LA EMPRESA:\n`;
  prompt += `${site.companyInfo || "No hay información adicional provista."}\n\n`;
  
  if (site.whatsappNumber) {
    prompt += `WHATSAPP DE CONTACTO:\n`;
    prompt += `Si el usuario solicita hablar con un humano, asesor, agente, o tiene una duda compleja que no puedes resolver con la información provista, invítalo amablemente a dar click en el botón de WhatsApp o contactar directamente a este número: ${site.whatsappNumber}\n\n`;
  }

  if (site.faqs && site.faqs.length > 0) {
    prompt += `PREGUNTAS FRECUENTES (Responde usando EXCLUSIVAMENTE esta información si el usuario pregunta sobre estos temas):\n`;
    site.faqs.forEach((faq, index) => {
      prompt += `${index + 1}. Pregunta: ${faq.q}\n   Respuesta: ${faq.a}\n`;
    });
    prompt += `\n`;
  }

  prompt += `DIRECTRICES DE COMPORTAMIENTO:\n`;
  prompt += `- Responde en el mismo idioma en el que te escribe el usuario (generalmente Español o Inglés).\n`;
  prompt += `- Mantén tus respuestas CONCISAS y directas para un chat de soporte flotante (máximo 2 o 3 párrafos cortos).\n`;
  prompt += `- Si no sabes la respuesta o la información no está detallada arriba, di amablemente que no tienes esa información y ofrece transferir con un asesor de soporte (mencionando WhatsApp si está disponible).\n`;
  prompt += `- NO inventes datos de contacto, precios o servicios que no estén explícitamente detallados arriba.\n`;
  prompt += `- Anti-spam: Responde educadamente pero no sigas el juego a insultos, bromas o temas completamente ajenos al soporte de la web.\n`;

  return prompt;
}

/**
 * Sends a message to the Groq API and returns the text response
 */
async function generateResponse(site, history, userMessage) {
  if (!groq) {
    return "Lo siento, el servicio de Inteligencia Artificial no está configurado correctamente en este momento.";
  }

  try {
    const systemContent = buildSystemPrompt(site);
    
    // Map existing message format to Groq role format:
    // our format: [{ sender: 'user'|'bot'|'agent', text: string }]
    // Groq format: [{ role: 'system'|'user'|'assistant', content: string }]
    const messages = [
      { role: "system", content: systemContent }
    ];

    // Append history (limit to last 10 messages to save context limits)
    const recentHistory = history.slice(-10);
    recentHistory.forEach(msg => {
      const role = msg.sender === 'user' ? 'user' : 'assistant';
      messages.push({ role, content: msg.text });
    });

    // Add current user message
    messages.push({ role: "user", content: userMessage });

    const model = site.aiModel || "llama-3.1-8b-instant";
    console.log(`📡 Querying Groq model: ${model}...`);

    const completion = await groq.chat.completions.create({
      messages,
      model,
      temperature: 0.3, // Low temperature for more factual, context-grounded responses
      max_tokens: 512
    });

    if (completion && completion.choices && completion.choices[0]) {
      return completion.choices[0].message.content.trim();
    } else {
      throw new Error("No response from Groq choices");
    }
  } catch (error) {
    console.error("❌ Groq API Error:", error);
    return "Disculpa, he experimentado un inconveniente al procesar tu respuesta. ¿Podrías volver a intentarlo en un momento?";
  }
}

/**
 * Simple intent detection to see if the user wants human support
 */
function detectsEscalationIntent(messageText) {
  const lowercase = messageText.toLowerCase();
  const humanKeywords = [
    'humano', 'asesor', 'agente', 'persona', 'hablar con alguien', 
    'soporte tecnico', 'whatsapp', 'telefono', 'llamar', 'operator', 
    'human', 'agent', 'support rep', 'speak to someone'
  ];
  return humanKeywords.some(keyword => lowercase.includes(keyword));
}

module.exports = {
  generateResponse,
  detectsEscalationIntent
};
