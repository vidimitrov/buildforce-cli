#!/usr/bin/env node
import "dotenv/config";
import { Command } from "commander";
import { InitCommand } from "./commands/init/index";
import { PlanCommand } from "./commands/plan/index";
import { ProjectAnalyzer } from "./analysis/analyzer";
import { createFileTools, createProjectUtils } from "./tools/file/index";
import { ChunkManager } from "./analysis/chunk";
import {
  ProjectAnalyzer as CoreProjectAnalyzer,
  FileTools,
} from "./types/project";

const program = new Command();

program
  .name("buildforce")
  .description("CLI tool for using the Buildforce planning capabilities")
  .version("0.0.0");

// Initialize dependencies
const fileTools: FileTools = createFileTools(process.cwd());
const projectUtils = createProjectUtils(process.cwd());
const chunkManager = new ChunkManager(fileTools);
const analyzer: CoreProjectAnalyzer = new ProjectAnalyzer(
  chunkManager,
  fileTools
);

// Initialize commands
const initCommand = new InitCommand(analyzer, fileTools, projectUtils);
initCommand.register(program);

const planCommand = new PlanCommand();
planCommand.register(program);

program.parse();
