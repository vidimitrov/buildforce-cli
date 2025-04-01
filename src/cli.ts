import { Command } from "commander";
import { commands } from "./commands";
import { ProjectAnalyzer, FileTools } from "./types/project";

export class CLI {
  private program: Command;

  constructor(private analyzer: ProjectAnalyzer, private fileTools: FileTools) {
    this.program = new Command();
    this.setupProgram();
  }

  private setupProgram(): void {
    this.program
      .name("buildforce")
      .description("CLI tool for project documentation and analysis")
      .version("1.0.0");

    // Register all commands
    commands.forEach((CommandClass) => {
      const command = new CommandClass(this.analyzer, this.fileTools);
      command.register(this.program);
    });
  }

  async run(args: string[]): Promise<void> {
    await this.program.parseAsync(args);
  }
}
