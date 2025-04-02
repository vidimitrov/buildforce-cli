import { ChatOpenAI } from "@langchain/openai";
import { OpenRouterConfig } from "../config";

/**
 * Gets the OpenRouter API configuration from environment variables
 * @returns Configuration object with API key and model
 * @throws Error if no API key is found
 */
export const getModelConfig = (): OpenRouterConfig => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model =
    process.env.OPENROUTER_MODEL || "anthropic/claude-3.7-sonnet:thinking";

  if (!apiKey) {
    throw new Error(
      "OpenRouter API key not found. Please set OPENROUTER_API_KEY in your .env file."
    );
  }

  return { apiKey, model };
};

/**
 * Gets model configuration with optional overrides
 * @param options Optional overrides for API key and model
 * @returns Configuration object with API key and model
 */
export const getModelConfigWithOverrides = (options?: {
  apiKey?: string;
  model?: string;
}): OpenRouterConfig => {
  const config = getModelConfig();
  return {
    apiKey: options?.apiKey || config.apiKey,
    model: options?.model || config.model,
  };
};

/**
 * Initializes a ChatOpenAI instance with configuration
 * @param options Optional overrides for API key and model
 * @returns ChatOpenAI instance
 */
export const initializeModel = (options?: {
  apiKey?: string;
  model?: string;
}): ChatOpenAI => {
  const config = getModelConfigWithOverrides(options);
  return new ChatOpenAI({
    apiKey: config.apiKey,
    model: config.model,
    temperature: 0.3,
    configuration: {
      baseURL: "https://openrouter.ai/api/v1",
    },
  });
};
