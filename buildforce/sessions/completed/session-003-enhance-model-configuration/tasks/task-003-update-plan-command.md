# Task 003: Update Plan Command with Override Options

## Architecture context

The plan command currently:

- Checks for buildforce initialization
- Prompts for initialization if needed
- Manages conversation flow with the LLM
- Uses environment variables for model configuration

## Specification context

The command needs to provide flexibility in model configuration without permanently changing stored settings:

- Allow temporary API key override
- Allow temporary model override
- Maintain stored configuration
- Provide clear usage instructions

## RULES

1. Add command-line options for temporary overrides
2. Validate override values
3. Ensure overrides don't affect stored configuration
4. Maintain TypeScript type safety
5. Provide clear error messages
6. Document new options

## Sub-Tasks & Progress Tracking

- [x] Add --api-key and --model options to plan command
- [x] Implement override handling logic
- [x] Add validation for override values
- [x] Update model initialization to use overrides
- [x] Add error handling for invalid overrides
- [x] Update command documentation

## Recap

All subtasks have been completed successfully:

1. Command Options:

   - Added --api-key and --model options
   - Implemented TypeScript interfaces for options
   - Added proper command documentation

2. Override Handling:

   - Implemented getModelConfigWithOverrides function
   - Added validation for override values
   - Ensured stored configuration remains unchanged

3. Model Integration:

   - Updated model initialization to use overrides
   - Added proper error handling
   - Improved user feedback with loading states

4. Testing:
   - Verified override functionality
   - Tested error handling
   - Confirmed configuration persistence

## Overview

Enhance the plan command to accept --api-key and --model options that temporarily override the stored configuration for the duration of the command execution.

## Implementation Plan

### Command Options Implementation

1. Update Plan Command Definition:

```typescript
program
  .command("plan")
  .description("Start planning a new coding session")
  .option("--api-key <key>", "Temporarily override the OpenRouter API key")
  .option("--model <model>", "Temporarily override the OpenRouter model")
  .action(async (options) => {
    // Implementation
  });
```

2. Override Handling:

```typescript
interface PlanCommandOptions {
  apiKey?: string;
  model?: string;
}

const getModelConfigWithOverrides = (options: PlanCommandOptions) => {
  const config = getModelConfig(); // Base configuration from env

  return {
    apiKey: options.apiKey || config.apiKey,
    model: options.model || config.model,
  };
};
```

3. Model Initialization with Overrides:

```typescript
const initializeModel = (options: PlanCommandOptions) => {
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
```

4. Plan Command Implementation:

```typescript
const runPlanCommand = async (options: PlanCommandOptions) => {
  // Check initialization
  if (!isBuildforceInitialized()) {
    console.log("Buildforce not initialized for this project.");
    const initialized = await promptForInitialization();

    if (!initialized) {
      return;
    }

    console.log("Initialization complete. Starting planning session...");
  }

  // Initialize model with potential overrides
  const model = initializeModel(options);

  // Existing conversation loop
  let conversationActive = true;
  let question = "What would you like to work on?";

  while (conversationActive) {
    const answer = await askModel(question, model);
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
};
```

## Testing / Verification Steps

1. Command Options:

   - Test --api-key option
   - Test --model option
   - Test both options together
   - Test with invalid options

2. Override Behavior:

   - Verify overrides work correctly
   - Confirm stored config remains unchanged
   - Check error handling for invalid values

3. Model Integration:

   - Test model initialization with overrides
   - Verify conversation flow works with overrides
   - Check error handling and recovery

4. Documentation:
   - Verify help text includes new options
   - Check error messages are clear
   - Ensure usage examples are accurate
