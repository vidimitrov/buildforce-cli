import inquirer from "inquirer";
import * as fs from "fs";
import * as path from "path";

export interface AIToolsSelection {
  selectedTools: string[]; // Array of selected tools: 'cursor', 'cline', 'windsurf'
}

/**
 * Gets the path to the rules templates directory
 * @returns Path to the rules templates directory
 */
const getRulesTemplateDir = (): string => {
  // In development, use the src directory
  const devPath = path.join(__dirname, "..", "..", "templates", "rules");
  if (fs.existsSync(devPath)) {
    return devPath;
  }

  // In production, use the dist directory
  const prodPath = path.join(__dirname, "..", "templates", "rules");
  if (fs.existsSync(prodPath)) {
    return prodPath;
  }

  throw new Error(
    "Rules template directory not found. Please ensure the templates are properly copied during build."
  );
};

/**
 * Sets up rules for a specific AI tool
 * @param targetDir Directory to set up rules in
 * @param tool The AI tool to set up rules for
 */
const setupToolRules = async (
  targetDir: string,
  tool: string
): Promise<void> => {
  try {
    const rulesTemplateDir = getRulesTemplateDir();

    switch (tool) {
      case "cursor": {
        const cursorRulesDir = path.join(targetDir, ".cursor", "rules");
        if (!fs.existsSync(cursorRulesDir)) {
          fs.mkdirSync(cursorRulesDir, { recursive: true });
        }

        const sourcePath = path.join(
          rulesTemplateDir,
          ".cursor",
          "rules",
          "buildforce.mdc"
        );
        const targetPath = path.join(cursorRulesDir, "buildforce.mdc");
        fs.copyFileSync(sourcePath, targetPath);
        console.log("Cursor rules setup completed");
        break;
      }

      case "cline": {
        const sourcePath = path.join(rulesTemplateDir, ".clinerules");
        const targetPath = path.join(targetDir, ".clinerules");
        await handleRulesFile(sourcePath, targetPath, ".clinerules");
        console.log("Cline rules setup completed");
        break;
      }

      case "windsurf": {
        const sourcePath = path.join(rulesTemplateDir, ".windsurfrules");
        const targetPath = path.join(targetDir, ".windsurfrules");
        await handleRulesFile(sourcePath, targetPath, ".windsurfrules");
        console.log("Windsurf rules setup completed");
        break;
      }
    }
  } catch (error) {
    console.error(`Error setting up ${tool} rules:`, error);
    throw error;
  }
};

/**
 * Handles copying or appending rules to a file
 * @param sourcePath Path to the source rules file
 * @param targetPath Path to the target rules file
 * @param fileName Name of the rules file for logging
 */
const handleRulesFile = async (
  sourcePath: string,
  targetPath: string,
  fileName: string
): Promise<void> => {
  if (fs.existsSync(targetPath)) {
    const existingContent = fs.readFileSync(targetPath, "utf8");
    const templateContent = fs.readFileSync(sourcePath, "utf8");
    fs.writeFileSync(targetPath, existingContent + "\n\n" + templateContent);
    console.log(`Appended content to existing ${fileName} file`);
  } else {
    fs.copyFileSync(sourcePath, targetPath);
    console.log(`Created new ${fileName} file`);
  }
};

/**
 * Prompts the user to select which AI tools they use
 * @returns Promise<AIToolsSelection> with the user's selection
 */
export const setupAITools = async (): Promise<AIToolsSelection> => {
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
    return { selectedTools: [] };
  }
};

/**
 * Sets up AI tools rules based on user selection
 * @param targetDir Directory to set up rules in
 * @param aiToolsSelection User's AI tools selection
 */
export const setupAIToolsRules = async (
  targetDir: string,
  aiToolsSelection: AIToolsSelection
): Promise<void> => {
  try {
    const { selectedTools } = aiToolsSelection;

    // Process each selected tool
    for (const tool of selectedTools) {
      await setupToolRules(targetDir, tool);
    }

    console.log("AI tools rules setup completed");
  } catch (error) {
    console.error("Error setting up AI tools rules:", error);
    throw error;
  }
};
