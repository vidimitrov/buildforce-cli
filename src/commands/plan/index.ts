import { Command } from "commander";
import * as readline from "readline";
import { createNewSession } from "../../services/session";
import { initializeModel } from "../../services/model";
import { isBuildforceInitialized } from "../../services/filesystem";
import { startPlanningConversation, askModel } from "../../agents/planning";

export class PlanCommand {
  constructor() {}

  register(program: Command): void {
    program
      .command("plan")
      .description("Start planning a new coding session")
      .option("--api-key <key>", "Temporarily override the OpenRouter API key")
      .option("--model <model>", "Temporarily override the OpenRouter model")
      .action(async (options) => {
        await this.execute(options);
      });
  }

  private async execute(options: {
    apiKey?: string;
    model?: string;
  }): Promise<void> {
    try {
      // Check if buildforce folder exists
      if (!isBuildforceInitialized()) {
        console.log("Buildforce not initialized for this project.");
        console.log('Please run "buildforce init <projectName>" first.');
        return;
      }

      console.log("Starting a new coding session...");
      console.log("Type EXIT or STOP to end the coding session.");
      console.log("Gathering project context...");

      // Create new session
      createNewSession();

      // Initialize model with potential overrides
      const modelInstance = initializeModel({
        apiKey: options.apiKey,
        model: options.model,
      });

      // If using overrides, log the configuration
      if (options.apiKey || options.model) {
        console.log("\nUsing temporary configuration overrides:");
        if (options.apiKey) console.log("- Custom API key");
        if (options.model) console.log(`- Model: ${options.model}`);
        console.log(); // Empty line for spacing
      }

      // Start planning conversation
      let conversationActive = true;

      // Initial welcome message
      const welcome = await startPlanningConversation(modelInstance);
      console.log(`\nBuildforce: ${welcome}\n`);

      while (conversationActive) {
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout,
        });

        const userInput = await new Promise<string>((resolve) => {
          rl.question("> ", resolve);
        });

        rl.close();

        if (
          userInput.toUpperCase() === "EXIT" ||
          userInput.toUpperCase() === "STOP"
        ) {
          conversationActive = false;
          console.log("\nEnding conversation...\n");
        } else {
          console.log("\nThinking...");
          const answer = await askModel(userInput, modelInstance);
          console.log(`\nBuildforce: ${answer}\n`);
        }
      }
    } catch (error) {
      console.error("Error during planning session:", error);
      process.exit(1);
    }
  }
}
