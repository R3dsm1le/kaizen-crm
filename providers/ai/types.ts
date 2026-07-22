import type { z } from "zod";

export interface GenerateOptions {
  temperature?: number;
  maxOutputTokens?: number;
}

/**
 * Abstraction over any LLM vendor. Services only ever depend on this
 * interface — swapping Gemini for another model is a one-file change.
 */
export interface AIProvider {
  readonly name: string;
  isConfigured(): boolean;
  generateText(prompt: string, options?: GenerateOptions): Promise<string>;
  /** Generate structured output validated against a Zod schema. */
  generateObject<T>(prompt: string, schema: z.ZodType<T>, options?: GenerateOptions): Promise<T>;
}

export class AINotConfiguredError extends Error {
  constructor() {
    super("No AI provider is configured. Add a Gemini API key in Settings → AI.");
    this.name = "AINotConfiguredError";
  }
}
