import * as fs from "fs";
import * as path from "path";
import { AIToolsSelection } from "./ai-tools";
import { setupAIToolsRules } from "./ai-tools";

/**
 * Gets the path to the buildforce templates directory
 * @returns Path to the templates directory
 */
const getTemplateDir = (): string => {
  // In development, use the src directory
  const devPath = path.join(__dirname, "..", "..", "templates", "buildforce");
  if (fs.existsSync(devPath)) {
    return devPath;
  }

  // In production, use the dist directory
  const prodPath = path.join(__dirname, "..", "templates", "buildforce");
  if (fs.existsSync(prodPath)) {
    return prodPath;
  }

  throw new Error(
    "Template directory not found. Please ensure the templates are properly copied during build."
  );
};

/**
 * Copies buildforce templates to the target directory
 * @param targetDir Directory to copy templates to
 * @param aiToolsSelection Optional AI tools selection for rule setup
 */
export const copyBuildforceTemplate = async (
  targetDir: string,
  aiToolsSelection?: AIToolsSelection
): Promise<void> => {
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
