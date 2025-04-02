import * as fs from "fs";
import * as path from "path";
import inquirer from "inquirer";

export interface OpenRouterConfig {
  apiKey: string;
  model: string;
}

/**
 * Checks if OpenRouter configuration exists in environment
 * @returns boolean indicating if both API key and model are configured
 */
export const hasOpenRouterConfig = (): boolean => {
  return Boolean(
    process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_MODEL
  );
};

/**
 * Gets existing OpenRouter configuration from environment
 * @returns Configuration object with API key and model
 */
export const getExistingOpenRouterConfig = (): OpenRouterConfig => {
  return {
    apiKey: process.env.OPENROUTER_API_KEY || "",
    model:
      process.env.OPENROUTER_MODEL || "anthropic/claude-3.7-sonnet:thinking",
  };
};

/**
 * Prompts the user for OpenRouter configuration if needed
 * @returns Promise with API key and model configuration
 */
export const promptForOpenRouterConfig =
  async (): Promise<OpenRouterConfig> => {
    // If configuration exists, return it
    if (hasOpenRouterConfig()) {
      return getExistingOpenRouterConfig();
    }

    try {
      const answers = await inquirer.prompt([
        {
          type: "input",
          name: "apiKey",
          message: "Enter your OpenRouter API key:",
          validate: (input) => input.trim() !== "" || "API key is required",
        },
        {
          type: "input",
          name: "model",
          message:
            "Enter OpenRouter model (default: anthropic/claude-3.7-sonnet:thinking):",
          default: "anthropic/claude-3.7-sonnet:thinking",
        },
      ]);

      return answers as OpenRouterConfig;
    } catch (error) {
      console.error("Error prompting for OpenRouter configuration:", error);
      throw error;
    }
  };

/**
 * Updates the .env file with OpenRouter configuration
 * @param apiKey OpenRouter API key
 * @param model OpenRouter model name
 */
export const updateEnvFile = (apiKey: string, model: string): void => {
  const envPath = path.join(process.cwd(), ".env");
  let envContent = "";

  // Read existing .env if it exists
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, "utf8");
  }

  // Update or add OPENROUTER_API_KEY
  if (envContent.includes("OPENROUTER_API_KEY=")) {
    envContent = envContent.replace(
      /OPENROUTER_API_KEY=.*\n?/,
      `OPENROUTER_API_KEY=${apiKey}\n`
    );
  } else {
    envContent += `\nOPENROUTER_API_KEY=${apiKey}`;
  }

  // Update or add OPENROUTER_MODEL
  if (envContent.includes("OPENROUTER_MODEL=")) {
    envContent = envContent.replace(
      /OPENROUTER_MODEL=.*\n?/,
      `OPENROUTER_MODEL=${model}\n`
    );
  } else {
    envContent += `\nOPENROUTER_MODEL=${model}`;
  }

  // Write back to .env
  fs.writeFileSync(envPath, envContent.trim() + "\n");
};
