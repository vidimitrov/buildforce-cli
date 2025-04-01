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

/**
 * Gets the OpenRouter API configuration from environment variables
 * @returns Configuration object with API key and model
 * @throws Error if no API key is found
 */
const getModelConfig = () => {
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
const getModelConfigWithOverrides = (options?: {
  apiKey?: string;
  model?: string;
}) => {
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
const initializeModel = (options?: { apiKey?: string; model?: string }) => {
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

/**
 * Reads a context file with fallback to default content
 * @param filePath Path to the context file
 * @param defaultContent Default content if file cannot be read
 * @returns Content of the file or default content
 */
const readContextFile = (filePath: string, defaultContent = ""): string => {
  try {
    return fs.readFileSync(path.join(process.cwd(), filePath), "utf8");
  } catch (error) {
    console.warn(`Warning: Could not read ${filePath}:`, error);
    return defaultContent;
  }
};

/**
 * Gets the next session number
 * @returns Next session number (e.g., "004" if last session was "003")
 */
const getNextSessionNumber = (): string => {
  const sessionsDir = path.join(process.cwd(), "buildforce", "sessions");
  const completedDir = path.join(sessionsDir, "completed");
  const plannedDir = path.join(sessionsDir, "planned");

  let maxNumber = 0;

  // Helper to scan directory for session numbers
  const scanDir = (dir: string) => {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir);
    for (const entry of entries) {
      const match = entry.match(/^session-(\d{3})/);
      if (match) {
        const num = parseInt(match[1]);
        maxNumber = Math.max(maxNumber, num);
      }
    }
  };

  // Scan both completed and planned directories
  scanDir(completedDir);
  scanDir(plannedDir);

  // Format next number with leading zeros
  return String(maxNumber + 1).padStart(3, "0");
};

/**
 * Creates a new planning session
 * @returns Path to the new session
 */
const createNewSession = (): string => {
  const nextNumber = getNextSessionNumber();
  const sessionName = `session-${nextNumber}`;
  const sessionPath = path.join(
    process.cwd(),
    "buildforce",
    "sessions",
    "planned",
    sessionName
  );

  // Create session directory and chat history file
  fs.mkdirSync(sessionPath, { recursive: true });
  fs.writeFileSync(path.join(sessionPath, ".chat-history.md"), "");

  // Update active session file
  const activeSessionPath = path.join(
    process.cwd(),
    "buildforce",
    "sessions",
    ".active-session"
  );
  fs.writeFileSync(activeSessionPath, `planned/${sessionName}\n`);

  return sessionPath;
};

/**
 * Gets the path to the active session
 * @returns Path to the active session or null if not found
 */
const getActiveSessionPath = (): string | null => {
  const activeSessionFilePath = path.join(
    process.cwd(),
    "buildforce",
    "sessions",
    ".active-session"
  );

  try {
    if (fs.existsSync(activeSessionFilePath)) {
      const activeSession = fs
        .readFileSync(activeSessionFilePath, "utf8")
        .trim();
      if (activeSession) {
        return path.join(
          process.cwd(),
          "buildforce",
          "sessions",
          activeSession
        );
      }
    }
    return null;
  } catch (error) {
    console.warn("Warning: Could not read active session:", error);
    return null;
  }
};

/**
 * Gets the current chat history
 * @returns Chat history content or default message if not available
 */
const getChatHistory = (): string => {
  const activeSessionPath = getActiveSessionPath();
  if (activeSessionPath) {
    const chatHistoryPath = path.join(activeSessionPath, ".chat-history.md");
    try {
      if (fs.existsSync(chatHistoryPath)) {
        return fs.readFileSync(chatHistoryPath, "utf8");
      }
    } catch (error) {
      console.warn("Warning: Could not read chat history:", error);
    }
  }
  return "No chat history available.";
};

/**
 * Updates the chat history with a new message
 * @param role Role of the message sender (User or Assistant)
 * @param content Content of the message
 */
const updateChatHistory = async (
  role: "User" | "Assistant",
  content: string
): Promise<void> => {
  const activeSessionPath = getActiveSessionPath();
  if (!activeSessionPath) {
    console.warn("Warning: No active session to update chat history");
    return;
  }

  const chatHistoryPath = path.join(activeSessionPath, ".chat-history.md");
  const timestamp = new Date().toISOString();
  const entry = `\n## ${timestamp} | ${role}\n\n${content}\n`;

  try {
    fs.appendFileSync(chatHistoryPath, entry);
  } catch (error) {
    console.error("Error updating chat history:", error);
    throw error;
  }
};

/**
 * Builds the system prompt with project context and current session history
 * @returns Complete system prompt with rules, project memory, and chat history
 */
const buildSystemPrompt = (): string => {
  const buildforceRules = readContextFile("buildforce/rules.md");
  const architecture = readContextFile("buildforce/memory/architecture.md");
  const specification = readContextFile("buildforce/memory/specification.md");
  const chatHistory = getChatHistory();

  return `You are a planning agent that follows the Buildforce workflow rules.

# Buildforce Rules
${buildforceRules}

# Project Architecture
${architecture}

# Project Specification
${specification}

# Current Session History
${chatHistory}

Your goal is to brainstorm with the user about the session they are about to start, and once all the needed information is in place, to construct a detailed plan and create the needed session files as described in the Buildforce rules. Be friendly and engaging, and refer back to previous messages in the conversation to maintain context.`;
};

/**
 * Starts a new planning conversation
 * @param modelInstance ChatOpenAI instance to use
 * @returns Initial welcome message
 */
const startPlanningConversation = async (
  modelInstance: ChatOpenAI
): Promise<string> => {
  const welcomeMessage = "Hey! What would you like to work on next?";
  await updateChatHistory("Assistant", welcomeMessage);
  return welcomeMessage;
};

/**
 * Asks the model a question and returns the response
 * @param input The input text to send to the model
 * @param modelInstance ChatOpenAI instance to use
 * @returns Promise with the model's response
 */
const askModel = async (input: string, modelInstance: ChatOpenAI) => {
  // First update chat history with user input
  await updateChatHistory("User", input);

  const prompt = ChatPromptTemplate.fromMessages([
    new SystemMessage(buildSystemPrompt()),
    new HumanMessage(input),
  ]);

  const parser = new StringOutputParser();
  const chain = prompt.pipe(modelInstance).pipe(parser);

  const response = await chain.invoke(input);

  // Then update chat history with assistant's response
  await updateChatHistory("Assistant", response);

  return response;
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

/**
 * Checks if OpenRouter configuration exists in environment
 * @returns boolean indicating if both API key and model are configured
 */
const hasOpenRouterConfig = (): boolean => {
  return Boolean(
    process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_MODEL
  );
};

/**
 * Gets existing OpenRouter configuration from environment
 * @returns Configuration object with API key and model
 */
const getExistingOpenRouterConfig = (): { apiKey: string; model: string } => {
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
const promptForOpenRouterConfig = async (): Promise<{
  apiKey: string;
  model: string;
}> => {
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

    return answers as { apiKey: string; model: string };
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
const updateEnvFile = (apiKey: string, model: string) => {
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

      // Get OpenRouter configuration if needed
      const config = await promptForOpenRouterConfig();
      let configUpdated = false;

      // Ask which AI tools the user uses
      const aiToolsSelection = await promptForAITools();

      // Copy templates and setup rules
      await copyBuildforceTemplate(process.cwd(), aiToolsSelection);

      // Update environment configuration only if we prompted for it
      if (!hasOpenRouterConfig()) {
        await updateEnvFile(config.apiKey, config.model);
        configUpdated = true;
      }

      // Show appropriate success message
      if (configUpdated) {
        console.log(
          "Successfully initialized project with OpenRouter configuration"
        );
      } else {
        console.log("Successfully initialized project");
      }
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

    // Get OpenRouter configuration if needed
    const config = await promptForOpenRouterConfig();
    let configUpdated = false;

    // Ask which AI tools the user uses
    const aiToolsSelection = await promptForAITools();

    // Initialize the project
    console.log(`Initializing project "${projectName}"...`);
    await copyBuildforceTemplate(process.cwd(), aiToolsSelection);

    // Update environment configuration only if we prompted for it
    if (!hasOpenRouterConfig()) {
      await updateEnvFile(config.apiKey, config.model);
      configUpdated = true;
    }

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
  .option("--api-key <key>", "Temporarily override the OpenRouter API key")
  .option("--model <model>", "Temporarily override the OpenRouter model")
  .action(async (options) => {
    try {
      // Check if buildforce folder exists
      if (!isBuildforceInitialized()) {
        console.log("Buildforce not initialized for this project.");
        const initialized = await promptForInitialization();

        if (!initialized) {
          // User chose not to initialize, exit the command
          return;
        }

        // Successfully initialized, continue with planning
        console.log("Initialization complete.");
      }

      console.log("Starting a new coding session...");
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
  });

program.parse();
