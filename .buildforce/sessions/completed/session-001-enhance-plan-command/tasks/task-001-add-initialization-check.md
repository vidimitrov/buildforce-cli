# Task: Add Initialization Check to Plan Command

## Overview

Enhance the `buildforce plan` command to check if the `.buildforce` folder exists in the current directory and prompt the user to initialize it if it doesn't.

## Sub-Tasks

- [x] Create a utility function `isBuildforceInitialized()` to check for the `.buildforce` folder
- [x] Implement `promptForInitialization()` to handle user interaction for initialization
- [x] Modify the `plan` command to use these functions
- [x] Test the flow with both initialized and uninitialized projects
- [x] Ensure proper error handling and user feedback

## Implementation Plan

### Utility Functions

```typescript
/**
 * Checks if the .buildforce folder exists in the current directory
 * @returns boolean indicating if the project is initialized
 */
const isBuildforceInitialized = (): boolean => {
  const buildforceDir = path.join(process.cwd(), ".buildforce");
  return fs.existsSync(buildforceDir);
};

/**
 * Prompts the user to initialize the project
 * @returns Promise<boolean> indicating if initialization was successful
 */
const promptForInitialization = async (): Promise<boolean> => {
  const readline = require("readline").createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  // Get current directory name as default project name
  const defaultProjectName = path.basename(process.cwd());

  try {
    // Ask if user wants to initialize
    const shouldInitialize = await new Promise<boolean>((resolve) => {
      readline.question(
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
      return false;
    }

    // Ask for project name with default
    const projectName = await new Promise<string>((resolve) => {
      readline.question(
        `Project name (default: ${defaultProjectName}): `,
        (answer: string) => resolve(answer.trim() || defaultProjectName)
      );
    });

    // Close readline interface
    readline.close();

    // Initialize the project
    console.log(`Initializing project "${projectName}"...`);
    await copyBuildforceTemplate(process.cwd());

    return true;
  } catch (error) {
    console.error("Error during initialization:", error);
    readline.close();
    return false;
  }
};
```

### Modified Plan Command

```typescript
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

      const readline = require("readline").createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      const userInput = await new Promise<string>((resolve) => {
        readline.question(
          "Your response (type EXIT or STOP to end): ",
          resolve
        );
      });

      readline.close();

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
```

## Testing

1. Test with an uninitialized project:

   - Run `buildforce plan` in a directory without a `.buildforce` folder
   - Verify the initialization prompt appears
   - Test both accepting and declining initialization
   - Verify planning continues after successful initialization

2. Test with an initialized project:
   - Run `buildforce plan` in a directory with a `.buildforce` folder
   - Verify planning starts immediately without initialization prompts

## Error Handling

- Handle file system errors during initialization check
- Provide clear error messages if initialization fails
- Ensure readline interfaces are properly closed in all scenarios

## Recap

The task has been successfully completed with the following implementations:

1. Created the `isBuildforceInitialized()` utility function that checks for the existence of the `.buildforce` folder in a specified directory (defaulting to the current working directory).

2. Implemented the `promptForInitialization()` function that:

   - Asks the user if they want to initialize the project
   - If yes, prompts for a project name (with the current directory name as default)
   - Initializes the project using the existing `copyBuildforceTemplate()` function
   - Returns a boolean indicating if initialization was successful

3. Modified the `plan` command to:

   - Check if the project is initialized before proceeding
   - Prompt for initialization if needed
   - Exit if the user chooses not to initialize
   - Continue with planning if initialization is successful or if already initialized

4. Added comprehensive tests in `src/tests/initialization-check.test.ts` to verify the functionality in both initialized and uninitialized environments.

The implementation follows the plan outlined in the task description and includes proper error handling and user feedback throughout the process. All subtasks have been completed and tested.
