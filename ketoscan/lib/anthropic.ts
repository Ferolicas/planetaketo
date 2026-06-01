import Anthropic from "@anthropic-ai/sdk";

// ============================================================
// Cliente Anthropic - SOLO SERVER-SIDE
// ============================================================
// Nunca importar este modulo desde un componente cliente.

declare global {
  // eslint-disable-next-line no-var
  var __anthropicClient: Anthropic | undefined;
}

export function getAnthropic(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY no esta definida en el entorno");
  }
  if (!global.__anthropicClient) {
    global.__anthropicClient = new Anthropic({ apiKey });
  }
  return global.__anthropicClient;
}

export function getModel(): string {
  return process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514";
}

/**
 * Extrae el primer bloque JSON de un texto que puede venir con markdown
 * (```json ... ```), prosa alrededor, etc. Lanza si no encuentra JSON valido.
 */
export function extractJson<T = unknown>(text: string): T {
  // Quitar fences de markdown
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenceMatch ? fenceMatch[1] : text;

  // Buscar el primer { ... } balanceado
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("No se encontro JSON en la respuesta del modelo");
  }
  const json = candidate.slice(start, end + 1);
  return JSON.parse(json) as T;
}
