#!/usr/bin/env node
import "dotenv/config";
import { Command } from "commander";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";

const model = new ChatOpenAI();

const askModel = async (input: string) => {
  const prompt = ChatPromptTemplate.fromMessages([
    new SystemMessage("You're a helpful assistant"),
    new HumanMessage(input),
  ]);

  const parser = new StringOutputParser();
  const chain = prompt.pipe(model).pipe(parser);

  return await chain.invoke(input);
};

const getTemplateDir = () => {
  // In development, use the src directory
  const devPath = path.join(__dirname, "..", "src", "templates", ".buildforce");
  if (fs.existsSync(devPath)) {
    return devPath;
  }

  // In production, use the dist directory
  const prodPath = path.join(__dirname, "templates", ".buildforce");
  if (fs.existsSync(prodPath)) {
    return prodPath;
  }

  throw new Error(
    "Template directory not found. Please ensure the templates are properly copied during build."
  );
};

const copyBuildforceTemplate = async (targetDir: string) => {
  const templateDir = getTemplateDir();
  const targetBuildforceDir = path.join(targetDir, ".buildforce");

  // Create the target directory if it doesn't exist
  if (!fs.existsSync(targetBuildforceDir)) {
    fs.mkdirSync(targetBuildforceDir, { recursive: true });
  }

  // Copy all files and directories from the template
  const copyDir = (src: string, dest: string) => {
    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      if (entry.isDirectory()) {
        fs.mkdirSync(destPath, { recursive: true });
        copyDir(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  };

  copyDir(templateDir, targetBuildforceDir);
  console.log("Successfully initialized project");
};

const program = new Command();

program
  .name("buildforce")
  .description("CLI tool for using the Buildforce planning capabilities")
  .version("0.0.0");

program
  .command("init")
  .description("Initialize a new project")
  .argument("<projectName>", "The project to initialize")
  .action(async (projectName) => {
    console.log("Initializing project...");
    console.log(`Project name: ${projectName}`);

    try {
      await copyBuildforceTemplate(process.cwd());
    } catch (error) {
      console.error("Error initializing project:", error);
      process.exit(1);
    }
  });

/**
 * Checks if the .buildforce folder exists in the specified directory
 * @param dir Directory to check, defaults to current working directory
 * @returns boolean indicating if the project is initialized
 */
const isBuildforceInitialized = (dir: string = process.cwd()): boolean => {
  const buildforceDir = path.join(dir, ".buildforce");
  return fs.existsSync(buildforceDir);
};

/**
 * Prompts the user to initialize the project
 * @returns Promise<boolean> indicating if initialization was successful
 */
const promptForInitialization = async (): Promise<boolean> => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  // Get current directory name as default project name
  const defaultProjectName = path.basename(process.cwd());

  try {
    // Ask if user wants to initialize
    const shouldInitialize = await new Promise<boolean>((resolve) => {
      rl.question(
        `No .buildforce folder found. Would you like to initialize the project first? (y/n): `,
        (answer: string) =>
          resolve(
            answer.toLowerCase() === "y" || answer.toLowerCase() === "yes"
          )
      );
    });

    if (!shouldInitialize) {
      console.log(
        'Initialization skipped. You can run "buildforce init <projectName>" later.'
      );
      rl.close();
      return false;
    }

    // Ask for project name with default
    const projectName = await new Promise<string>((resolve) => {
      rl.question(
        `Project name (default: ${defaultProjectName}): `,
        (answer: string) => resolve(answer.trim() || defaultProjectName)
      );
    });

    // Close readline interface
    rl.close();

    // Initialize the project
    console.log(`Initializing project "${projectName}"...`);
    await copyBuildforceTemplate(process.cwd());

    return true;
  } catch (error) {
    console.error("Error during initialization:", error);
    rl.close();
    return false;
  }
};

program
  .command("plan")
  .description("Start planning a new coding session")
  .action(async () => {
    // Check if .buildforce folder exists
    if (!isBuildforceInitialized()) {
      console.log("Buildforce not initialized for this project.");
      const initialized = await promptForInitialization();

      if (!initialized) {
        // User chose not to initialize, exit the command
        return;
      }

      // Successfully initialized, continue with planning
      console.log("Initialization complete. Starting planning session...");
    }

    // Existing plan command functionality
    let conversationActive = true;
    let question = "What would you like to work on?";

    while (conversationActive) {
      const answer = await askModel(question);
      console.log(`\nBuildforce: ${answer}\n`);

      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      const userInput = await new Promise<string>((resolve) => {
        rl.question("Your response (type EXIT or STOP to end): ", resolve);
      });

      rl.close();

      if (
        userInput.toUpperCase() === "EXIT" ||
        userInput.toUpperCase() === "STOP"
      ) {
        conversationActive = false;
        console.log("\nEnding conversation...\n");
      } else {
        question = userInput;
      }
    }
  });

program.parse();
