import { Command } from "commander";
import { InitAgent, InitAgentConfig } from "../agents/init";
import { ProjectAnalyzer, FileTools } from "../types/project";

export class InitCommand {
  constructor(
    private analyzer: ProjectAnalyzer,
    private fileTools: FileTools
  ) {}

  register(program: Command): void {
    program
      .command("init")
      .description("Initialize project documentation")
      .argument("[projectName]", "Name of the project")
      .option("-s, --skip-analysis", "Skip project analysis")
      .option("-f, --force", "Force overwrite existing documentation")
      .option("-v, --verbose", "Enable verbose output")
      .action(async (projectName: string, options: Record<string, boolean>) => {
        await this.execute(projectName, options);
      });
  }

  async execute(
    projectName: string,
    options: Record<string, boolean>
  ): Promise<void> {
    try {
      const config: InitAgentConfig = {
        projectName: projectName || process.cwd().split("/").pop() || "unknown",
        rootDir: process.cwd(),
        options: {
          skipAnalysis: options.skipAnalysis,
          force: options.force,
          verbose: options.verbose,
        },
      };

      const agent = new InitAgent(config, {
        analyzer: this.analyzer,
        fileTools: this.fileTools,
      });

      const result = await agent.execute();

      if (result.success) {
        console.log("✅ Project analyzed successfully");
        if (result.warnings.length > 0) {
          console.log("\n⚠️ Warnings:");
          result.warnings.forEach((warning) => console.log(`  - ${warning}`));
        }
        console.log("\n📚 Generated documentation:");
        console.log(`  - Architecture: ${result.documentation.architecture}`);
        console.log(`  - Specification: ${result.documentation.specification}`);
      } else {
        console.error("❌ Failed to analyze project");
        if (result.errors.length > 0) {
          console.error("\nErrors:");
          result.errors.forEach((error) => console.error(`  - ${error}`));
        }
        throw new Error("Failed to analyze project");
      }
    } catch (error) {
      console.error("❌ An unexpected error occurred:", error);
      throw error;
    }
  }
}
