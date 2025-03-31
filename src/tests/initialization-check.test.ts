import * as fs from "fs";
import * as path from "path";

/**
 * Parse command line arguments
 * @returns Object containing parsed arguments
 */
const parseArgs = (): { dir?: string } => {
  const args: { dir?: string } = {};

  process.argv.forEach((arg, index) => {
    if (arg === "--dir" && process.argv[index + 1]) {
      args.dir = process.argv[index + 1];
    } else if (arg.startsWith("--dir=")) {
      args.dir = arg.split("=")[1];
    }
  });

  return args;
};

/**
 * Checks if the .buildforce folder exists in the specified directory
 * @param dir Directory to check
 * @returns boolean indicating if the project is initialized
 */
const isBuildforceInitialized = (dir: string): boolean => {
  const buildforceDir = path.join(dir, ".buildforce");
  return fs.existsSync(buildforceDir);
};

/**
 * Test function to verify the initialization check
 */
const testInitializationCheck = (): void => {
  const args = parseArgs();
  const testDir = args.dir || process.cwd();

  console.log("Testing initialization check:");
  console.log(`Test directory: ${testDir}`);
  console.log(
    `Buildforce directory path: ${path.join(testDir, ".buildforce")}`
  );
  console.log(`Is buildforce initialized: ${isBuildforceInitialized(testDir)}`);

  // If not initialized, simulate the prompt
  if (!isBuildforceInitialized(testDir)) {
    console.log("Buildforce not initialized for this project.");
    console.log("Would prompt for initialization here.");
  } else {
    console.log(
      "Buildforce is already initialized, would proceed with planning."
    );
  }

  // List files in test directory
  console.log("\nFiles in test directory:");
  try {
    const files = fs.readdirSync(testDir);
    files.forEach((file) => console.log(` - ${file}`));
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error listing files: ${error.message}`);
    } else {
      console.error("Unknown error occurred while listing files");
    }
  }
};

// Run the test
testInitializationCheck();
