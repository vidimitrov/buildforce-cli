import * as fs from "fs";
import * as path from "path";
import * as os from "os";

/**
 * Creates a temporary directory for testing
 * @returns Path to the temporary directory
 */
const createTempTestDir = (): string => {
  const tempDir = path.join(os.tmpdir(), `buildforce-test-${Date.now()}`);
  fs.mkdirSync(tempDir, { recursive: true });
  return tempDir;
};

/**
 * Cleans up the temporary test directory
 * @param dir Directory to remove
 */
const cleanupTempDir = (dir: string): void => {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
};

/**
 * Simulates the init command functionality
 * @param targetDir Directory where buildforce should be initialized
 * @returns boolean indicating success
 */
const initBuildforce = (targetDir: string): boolean => {
  try {
    // Create the buildforce directory structure
    const buildforceDir = path.join(targetDir, "buildforce");
    const memoryDir = path.join(buildforceDir, "memory");
    const sessionsDir = path.join(buildforceDir, "sessions");
    const templatesDir = path.join(buildforceDir, "templates");
    
    fs.mkdirSync(buildforceDir, { recursive: true });
    fs.mkdirSync(memoryDir, { recursive: true });
    fs.mkdirSync(sessionsDir, { recursive: true });
    fs.mkdirSync(templatesDir, { recursive: true });
    
    // Create .active-session file
    fs.writeFileSync(path.join(sessionsDir, ".active-session"), "");
    
    // Create .gitkeep in memory directory
    fs.writeFileSync(path.join(memoryDir, ".gitkeep"), "");
    
    // Create template files
    fs.writeFileSync(path.join(templatesDir, "architecture-template.md"), "# Architecture Template");
    fs.writeFileSync(path.join(templatesDir, "session-template.md"), "# Session Template");
    fs.writeFileSync(path.join(templatesDir, "specification-template.md"), "# Specification Template");
    fs.writeFileSync(path.join(templatesDir, "task-template.md"), "# Task Template");
    
    // Create README.md
    fs.writeFileSync(path.join(buildforceDir, "README.md"), "# Buildforce\n\nThis is the buildforce project management system.");
    
    // Create rules.md
    fs.writeFileSync(path.join(buildforceDir, "rules.md"), "# Buildforce Rules\n\nRules for the buildforce system.");
    
    return true;
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error initializing buildforce: ${error.message}`);
    } else {
      console.error("Unknown error occurred during initialization");
    }
    return false;
  }
};

/**
 * Checks if the buildforce folder exists in the specified directory
 * @param dir Directory to check
 * @returns boolean indicating if the project is initialized
 */
const isBuildforceInitialized = (dir: string): boolean => {
  const buildforceDir = path.join(dir, "buildforce");
  return fs.existsSync(buildforceDir);
};

/**
 * Verifies the structure of an initialized buildforce directory
 * @param dir Directory to check
 * @returns Object with verification results
 */
const verifyBuildforceStructure = (dir: string): { 
  isValid: boolean;
  missingItems: string[];
} => {
  const result = {
    isValid: true,
    missingItems: [] as string[]
  };
  
  const requiredPaths = [
    path.join(dir, "buildforce"),
    path.join(dir, "buildforce", "memory"),
    path.join(dir, "buildforce", "sessions"),
    path.join(dir, "buildforce", "templates"),
    path.join(dir, "buildforce", "README.md"),
    path.join(dir, "buildforce", "rules.md"),
    path.join(dir, "buildforce", "sessions", ".active-session"),
    path.join(dir, "buildforce", "memory", ".gitkeep"),
    path.join(dir, "buildforce", "templates", "architecture-template.md"),
    path.join(dir, "buildforce", "templates", "session-template.md"),
    path.join(dir, "buildforce", "templates", "specification-template.md"),
    path.join(dir, "buildforce", "templates", "task-template.md")
  ];
  
  for (const requiredPath of requiredPaths) {
    if (!fs.existsSync(requiredPath)) {
      result.isValid = false;
      result.missingItems.push(requiredPath);
    }
  }
  
  return result;
};

/**
 * Test the init command functionality
 */
const testInitCommand = (): void => {
  console.log("Testing init command functionality:");
  
  // Create a temporary directory for testing
  const testDir = createTempTestDir();
  console.log(`Created test directory: ${testDir}`);
  
  try {
    // Verify the directory is not initialized
    console.log(`Is buildforce already initialized: ${isBuildforceInitialized(testDir)}`);
    
    if (isBuildforceInitialized(testDir)) {
      console.log("Test directory already has buildforce initialized, this is unexpected.");
      return;
    }
    
    // Run the init command
    console.log("Running init command...");
    const initResult = initBuildforce(testDir);
    console.log(`Init command result: ${initResult ? "Success" : "Failed"}`);
    
    // Verify the directory is now initialized
    const isInitialized = isBuildforceInitialized(testDir);
    console.log(`Is buildforce now initialized: ${isInitialized}`);
    
    // Verify the structure
    const structureVerification = verifyBuildforceStructure(testDir);
    console.log(`Structure verification: ${structureVerification.isValid ? "Valid" : "Invalid"}`);
    
    if (!structureVerification.isValid) {
      console.log("Missing items:");
      structureVerification.missingItems.forEach(item => console.log(` - ${item}`));
    }
    
    // Test re-initialization (should detect existing buildforce)
    console.log("\nTesting re-initialization:");
    if (isInitialized) {
      console.log("Buildforce is already initialized, would show warning message here.");
    }
    
    // List files in the buildforce directory
    console.log("\nFiles in buildforce directory:");
    try {
      const buildforceDir = path.join(testDir, "buildforce");
      const listDirRecursive = (dir: string, indent = 0) => {
        const files = fs.readdirSync(dir);
        files.forEach(file => {
          const filePath = path.join(dir, file);
          const stats = fs.statSync(filePath);
          console.log(`${' '.repeat(indent)} - ${file}${stats.isDirectory() ? '/' : ''}`);
          if (stats.isDirectory()) {
            listDirRecursive(filePath, indent + 2);
          }
        });
      };
      
      listDirRecursive(buildforceDir);
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Error listing files: ${error.message}`);
      } else {
        console.error("Unknown error occurred while listing files");
      }
    }
  } finally {
    // Clean up
    console.log(`\nCleaning up test directory: ${testDir}`);
    cleanupTempDir(testDir);
    console.log("Test completed.");
  }
};

// Run the test
testInitCommand();
