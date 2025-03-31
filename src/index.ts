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
import inquirer from "inquirer";

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

// AI Tools selection interface
interface AIToolsSelection {
  selectedTools: string[]; // Array of selected tools: 'cursor', 'cline', 'windsurf'
}

const getTemplateDir = () => {
  // In development, use the src directory
  const devPath = path.join(__dirname, "..", "src", "templates", "buildforce");
  if (fs.existsSync(devPath)) {
    return devPath;
  }

  // In production, use the dist directory
  const prodPath = path.join(__dirname, "templates", "buildforce");
  if (fs.existsSync(prodPath)) {
    return prodPath;
  }

  throw new Error(
    "Template directory not found. Please ensure the templates are properly copied during build."
  );
};

/**
 * Gets the path to the rules templates directory
 * @returns Path to the rules templates directory
 */
const getRulesTemplateDir = () => {
  // In development, use the src directory
  const devPath = path.join(__dirname, "..", "src", "templates", "rules");
  if (fs.existsSync(devPath)) {
    return devPath;
  }

  // In production, use the dist directory
  const prodPath = path.join(__dirname, "templates", "rules");
  if (fs.existsSync(prodPath)) {
    return prodPath;
  }

  throw new Error(
    "Rules template directory not found. Please ensure the templates are properly copied during build."
  );
};

const copyBuildforceTemplate = async (
  targetDir: string,
  aiToolsSelection?: AIToolsSelection
) => {
  const templateDir = getTemplateDir();
  const targetBuildforceDir = path.join(targetDir, "buildforce");

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

  // Setup AI tools rules if selected
  if (aiToolsSelection && aiToolsSelection.selectedTools.length > 0) {
    await setupAIToolsRules(targetDir, aiToolsSelection);
  }

  console.log("Successfully initialized project");
};

/**
 * Sets up AI tools rules based on user selection
 * @param targetDir Directory to set up rules in
 * @param aiToolsSelection User's AI tools selection
 */
const setupAIToolsRules = async (
  targetDir: string,
  aiToolsSelection: AIToolsSelection
): Promise<void> => {
  try {
    const { selectedTools } = aiToolsSelection;

    // Process each selected tool
    for (const tool of selectedTools) {
      switch (tool) {
        case "cursor":
          await setupCursorRules(targetDir);
          break;
        case "cline":
          await setupClineRules(targetDir);
          break;
        case "windsurf":
          await setupWindsurfRules(targetDir);
          break;
      }
    }

    console.log("AI tools rules setup completed");
  } catch (error) {
    console.error("Error setting up AI tools rules:", error);
    throw error;
  }
};

/**
 * Sets up Cursor rules
 * @param targetDir Directory to set up rules in
 */
const setupCursorRules = async (targetDir: string): Promise<void> => {
  try {
    const rulesTemplateDir = getRulesTemplateDir();
    const cursorRulesDir = path.join(targetDir, ".cursor", "rules");

    // Create .cursor/rules directory if it doesn't exist
    if (!fs.existsSync(cursorRulesDir)) {
      fs.mkdirSync(cursorRulesDir, { recursive: true });
    }

    // Copy buildforce.mdc to .cursor/rules/
    const sourcePath = path.join(
      rulesTemplateDir,
      ".cursor",
      "rules",
      "buildforce.mdc"
    );
    const targetPath = path.join(cursorRulesDir, "buildforce.mdc");

    fs.copyFileSync(sourcePath, targetPath);
    console.log("Cursor rules setup completed");
  } catch (error) {
    console.error("Error setting up Cursor rules:", error);
    throw error;
  }
};

/**
 * Sets up Cline rules
 * @param targetDir Directory to set up rules in
 */
const setupClineRules = async (targetDir: string): Promise<void> => {
  try {
    const rulesTemplateDir = getRulesTemplateDir();
    const sourcePath = path.join(rulesTemplateDir, ".clinerules");
    const targetPath = path.join(targetDir, ".clinerules");

    // Check if file already exists
    if (fs.existsSync(targetPath)) {
      // Append content to existing file
      const existingContent = fs.readFileSync(targetPath, "utf8");
      const templateContent = fs.readFileSync(sourcePath, "utf8");

      // Write combined content back to the file
      fs.writeFileSync(targetPath, existingContent + "\n\n" + templateContent);
      console.log("Appended content to existing .clinerules file");
    } else {
      // Copy .clinerules to target directory
      fs.copyFileSync(sourcePath, targetPath);
      console.log("Created new .clinerules file");
    }

    console.log("Cline rules setup completed");
  } catch (error) {
    console.error("Error setting up Cline rules:", error);
    throw error;
  }
};

/**
 * Sets up Windsurf rules
 * @param targetDir Directory to set up rules in
 */
const setupWindsurfRules = async (targetDir: string): Promise<void> => {
  try {
    const rulesTemplateDir = getRulesTemplateDir();
    const sourcePath = path.join(rulesTemplateDir, ".windsurfrules");
    const targetPath = path.join(targetDir, ".windsurfrules");

    // Check if file already exists
    if (fs.existsSync(targetPath)) {
      // Append content to existing file
      const existingContent = fs.readFileSync(targetPath, "utf8");
      const templateContent = fs.readFileSync(sourcePath, "utf8");

      // Write combined content back to the file
      fs.writeFileSync(targetPath, existingContent + "\n\n" + templateContent);
      console.log("Appended content to existing .windsurfrules file");
    } else {
      // Copy .windsurfrules to target directory
      fs.copyFileSync(sourcePath, targetPath);
      console.log("Created new .windsurfrules file");
    }

    console.log("Windsurf rules setup completed");
  } catch (error) {
    console.error("Error setting up Windsurf rules:", error);
    throw error;
  }
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
    console.log(`Project name: ${projectName}`);

    try {
      // Check if project is already initialized
      if (isBuildforceInitialized()) {
        console.log(`Project ${projectName} is already initialized.`);
        return;
      }

      console.log("Initializing project...");

      // Ask which AI tools the user uses
      const aiToolsSelection = await promptForAITools();

      await copyBuildforceTemplate(process.cwd(), aiToolsSelection);
    } catch (error) {
      console.error("Error initializing project:", error);
      process.exit(1);
    }
  });

/**
 * Checks if the buildforce folder exists in the specified directory
 * @param dir Directory to check, defaults to current working directory
 * @returns boolean indicating if the project is initialized
 */
const isBuildforceInitialized = (dir: string = process.cwd()): boolean => {
  const buildforceDir = path.join(dir, "buildforce");
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
        `No buildforce folder found. Would you like to initialize the project first? (y/n): `,
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

    // Ask which AI tools the user uses
    const aiToolsSelection = await promptForAITools();

    // Initialize the project
    console.log(`Initializing project "${projectName}"...`);
    await copyBuildforceTemplate(process.cwd(), aiToolsSelection);

    return true;
  } catch (error) {
    console.error("Error during initialization:", error);
    rl.close();
    return false;
  }
};

/**
 * Prompts the user to select which AI tools they use
 * @returns Promise<AIToolsSelection> with the user's selection
 */
const promptForAITools = async (): Promise<AIToolsSelection> => {
  try {
    const answers = await inquirer.prompt([
      {
        type: "checkbox",
        name: "selectedTools",
        message: "Select which AI-assisted coding tools you use:",
        choices: [
          { name: "Cursor", value: "cursor", checked: true },
          { name: "Cline", value: "cline", checked: true },
          { name: "Windsurf", value: "windsurf", checked: true },
        ],
      },
    ]);

    return answers as AIToolsSelection;
  } catch (error) {
    console.error("Error prompting for AI tools:", error);
    // Return empty selection if there's an error
    return { selectedTools: [] };
  }
};

program
  .command("plan")
  .description("Start planning a new coding session")
  .action(async () => {
    // Check if buildforce folder exists
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
