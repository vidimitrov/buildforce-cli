import { Command } from "commander";
import { ProjectAnalyzer, FileTools } from "./types/project";
import { ProjectUtils } from "./tools/file/types";
import { createFileTools, createProjectUtils } from "./tools/file/index";
import { ChunkManager } from "./analysis/chunk";
import { ProjectAnalyzer as CoreProjectAnalyzer } from "./analysis/analyzer";

export class CLI {
  private analyzer: ProjectAnalyzer;
  private fileTools: FileTools;
  private projectUtils: ProjectUtils;

  constructor() {
    // Initialize dependencies
    this.fileTools = createFileTools(process.cwd());
    this.projectUtils = createProjectUtils(process.cwd());
    const chunkManager = new ChunkManager(this.fileTools);
    this.analyzer = new CoreProjectAnalyzer(chunkManager, this.fileTools);
  }

  async registerCommand(
    program: Command,
    CommandClass: new (
      analyzer: ProjectAnalyzer,
      fileTools: FileTools,
      projectUtils: ProjectUtils
    ) => any
  ): Promise<void> {
    const command = new CommandClass(
      this.analyzer,
      this.fileTools,
      this.projectUtils
    );
    command.register(program);
  }
}
