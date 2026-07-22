import type { AISettings } from "@/lib/settings-schema";
import { GeminiProvider } from "./gemini";
import type { AIProvider } from "./types";

export type { AIProvider, GenerateOptions } from "./types";
export { AINotConfiguredError } from "./types";

/**
 * Resolve the configured AI provider. Settings take priority; the
 * GEMINI_API_KEY env var works as a zero-UI fallback.
 */
export function createAIProvider(settings: AISettings): AIProvider {
  const apiKey = settings.geminiApiKey || process.env.GEMINI_API_KEY || "";
  return new GeminiProvider(apiKey, settings.model);
}
