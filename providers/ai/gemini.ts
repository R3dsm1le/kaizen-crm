import { GoogleGenAI } from "@google/genai";
import type { z } from "zod";
import type { AIProvider, GenerateOptions } from "./types";
import { AINotConfiguredError } from "./types";

export class GeminiProvider implements AIProvider {
  readonly name = "gemini";
  private client: GoogleGenAI | null;

  constructor(
    private apiKey: string,
    private model: string = "gemini-2.5-flash"
  ) {
    this.client = apiKey ? new GoogleGenAI({ apiKey }) : null;
  }

  isConfigured(): boolean {
    return this.client !== null;
  }

  async generateText(prompt: string, options?: GenerateOptions): Promise<string> {
    if (!this.client) throw new AINotConfiguredError();
    const response = await this.client.models.generateContent({
      model: this.model,
      contents: prompt,
      config: {
        temperature: options?.temperature ?? 0.7,
        maxOutputTokens: options?.maxOutputTokens,
      },
    });
    return response.text ?? "";
  }

  async generateObject<T>(
    prompt: string,
    schema: z.ZodType<T>,
    options?: GenerateOptions
  ): Promise<T> {
    if (!this.client) throw new AINotConfiguredError();
    const response = await this.client.models.generateContent({
      model: this.model,
      contents: prompt,
      config: {
        temperature: options?.temperature ?? 0.4,
        maxOutputTokens: options?.maxOutputTokens,
        responseMimeType: "application/json",
      },
    });
    const raw = response.text ?? "";
    const json = extractJson(raw);
    return schema.parse(json);
  }
}

/** Tolerates code fences and stray prose around the JSON payload. */
function extractJson(raw: string): unknown {
  const trimmed = raw.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (!match) throw new Error(`AI returned no parseable JSON: ${trimmed.slice(0, 200)}`);
    return JSON.parse(match[0]);
  }
}
