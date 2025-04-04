import { Command } from "commander";
import { InitAgent, InitAgentConfig } from "../../agents/init";
import { setupAITools } from "./ai-tools";
import { copyBuildforceTemplate } from "./templates";
import {
  promptForOpenRouterConfig,
  updateEnvFile,
} from "../../services/config";
import { isBuildforceInitialized } from "../../services/filesystem";
import { ProjectAnalyzer, FileTools } from "../../types/project";
import { ProjectUtils } from "../../tools/file/types";
import { initializeModel } from "../../services/model";

export class InitCommand {
  constructor(
    private analyzer: ProjectAnalyzer,
    private fileTools: FileTools,
    private projectUtils: ProjectUtils
  ) {}

  register(program: Command): void {
    program
      .command("init <projectName>")
      .description("Initialize a new project with Buildforce")
      .option("--skip-analysis", "Skip project analysis")
      .option("--force", "Force initialization even if already initialized")
      .option("--verbose", "Enable verbose output")
      .option("--dev-mode", "Enable development mode")
      .action(async (projectName: string, options: Record<string, boolean>) => {
        await this.execute(projectName, options);
      });
  }

  async execute(
    projectName: string,
    options: Record<string, boolean>
  ): Promise<void> {
    try {
      // Check if project is already initialized
      if (isBuildforceInitialized()) {
        console.log(`Project ${projectName} is already initialized.`);
        return;
      }

      console.log(`Initializing project ${projectName}...`);

      // Get OpenRouter configuration if needed
      const config = await promptForOpenRouterConfig();
      let configUpdated = false;

      // Ask which AI tools the user uses
      const aiToolsSelection = await setupAITools();

      // Copy templates and setup rules
      await copyBuildforceTemplate(process.cwd(), aiToolsSelection);

      // Update environment configuration only if we prompted for it
      if (!config.apiKey || !config.model) {
        await updateEnvFile(config.apiKey, config.model);
        configUpdated = true;
      }

      // Initialize the LLM model
      const model = initializeModel({
        apiKey: config.apiKey,
        model: config.model,
      });

      // Initialize the agent with configuration
      const agentConfig: InitAgentConfig = {
        projectName: projectName || process.cwd().split("/").pop() || "unknown",
        rootDir: process.cwd(),
        options: {
          skipAnalysis: options.skipAnalysis,
          force: options.force,
          verbose: options.verbose,
          devMode: options.devMode,
        },
      };

      const agent = new InitAgent(
        agentConfig,
        this.analyzer,
        this.fileTools,
        this.projectUtils,
        model
      );

      // Execute the agent
      const result = await agent.execute();

      if (result.success) {
        console.log("\nProject initialized successfully!");
        if (result.warnings.length > 0) {
          console.log("\nWarnings:");
          result.warnings.forEach((warning) => console.log(`- ${warning}`));
        }
      } else {
        console.error("\nFailed to initialize project:");
        result.errors.forEach((error) => console.error(`- ${error}`));
        process.exit(1);
      }
    } catch (error) {
      console.error("Failed to initialize project:", error);
      process.exit(1);
    }
  }
}
