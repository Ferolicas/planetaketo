import OpenAI from "openai";

// ============================================================
// Cliente OpenAI - SOLO SERVER-SIDE
// ============================================================
// Reemplaza a Anthropic para las dos funciones de IA de ketoscan:
//   - /api/scan         (visión: foto -> datos nutricionales por 100g)
//   - /api/generate-menu (texto: genera menú semanal)
// El modelo es configurable por OPENAI_MODEL (debe soportar visión para el scan).

declare global {
  // eslint-disable-next-line no-var
  var __openaiClient: OpenAI | undefined;
}

export function getOpenAI(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY no esta definida en el entorno");
  }
  if (!global.__openaiClient) {
    global.__openaiClient = new OpenAI({ apiKey });
  }
  return global.__openaiClient;
}

// Modelo de visión vigente por defecto; sobreescribible por entorno.
export function getModel(): string {
  return process.env.OPENAI_MODEL || "gpt-4o";
}

/**
 * Extrae el primer objeto JSON de un texto (por si llega con fences/markdown).
 * Con response_format json_object normalmente ya viene limpio.
 */
export function extractJson<T = unknown>(text: string): T {
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenceMatch ? fenceMatch[1] : text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("No se encontro JSON en la respuesta del modelo");
  }
  return JSON.parse(candidate.slice(start, end + 1)) as T;
}
