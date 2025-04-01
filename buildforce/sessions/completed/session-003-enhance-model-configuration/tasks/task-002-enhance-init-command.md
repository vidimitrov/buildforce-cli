# Task 002: Enhance Init Command with Interactive Configuration

## Architecture context

The CLI tool uses the Commander library for command-line interface implementation and inquirer for interactive prompts. The init command currently handles:

- Project initialization with templates
- AI tools selection through interactive prompts
- Setting up rule files based on selected tools

## Specification context

The tool needs to provide a smooth onboarding experience while ensuring secure configuration. This includes:

- Interactive configuration during initialization
- Secure storage of sensitive data
- Clear default values and options
- Proper validation of user input

## RULES

1. Use interactive prompts for configuration
2. Validate API key input (required)
3. Provide default model option
4. Update .env file securely
5. Handle existing configurations gracefully
6. Follow TypeScript best practices

## Sub-Tasks & Progress Tracking

- [x] Create OpenRouter configuration prompts
- [x] Add validation for API key input
- [x] Implement .env file update functionality
- [x] Handle existing configuration cases
- [x] Add error handling for file operations
- [x] Update init command documentation

## Recap

All subtasks have been completed successfully:

1. Interactive Configuration:

   - Implemented OpenRouter configuration prompts using inquirer
   - Added validation for required API key
   - Added default model option with clear messaging

2. Environment File Management:

   - Implemented secure .env file updates
   - Added handling for existing configurations
   - Ensured proper file permissions and line endings

3. Error Handling:

   - Added comprehensive error handling for file operations
   - Implemented user-friendly error messages
   - Added proper error recovery behavior

4. Documentation:
   - Updated command documentation
   - Added clear success messages
   - Documented configuration options

## Overview

Enhance the init command to interactively collect OpenRouter API key and model configuration during project initialization, storing these values in the project's .env file.

## Implementation Plan

### Interactive Configuration Implementation

1. Configuration Prompts:

```typescript
const promptForOpenRouterConfig = async (): Promise<{
  apiKey: string;
  model: string;
}> => {
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
```

2. Environment File Management:

```typescript
const updateEnvFile = (apiKey: string, model: string) => {
  const envPath = path.join(process.cwd(), ".env");
  let envContent = "";

  // Read existing .env if it exists
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, "utf8");
  }

  // Update or add BUILDFORCE_API_KEY
  if (envContent.includes("BUILDFORCE_API_KEY=")) {
    envContent = envContent.replace(
      /BUILDFORCE_API_KEY=.*\n?/,
      `BUILDFORCE_API_KEY=${apiKey}\n`
    );
  } else {
    envContent += `\nBUILDFORCE_API_KEY=${apiKey}`;
  }

  // Update or add BUILDFORCE_MODEL
  if (envContent.includes("BUILDFORCE_MODEL=")) {
    envContent = envContent.replace(
      /BUILDFORCE_MODEL=.*\n?/,
      `BUILDFORCE_MODEL=${model}\n`
    );
  } else {
    envContent += `\nBUILDFORCE_MODEL=${model}`;
  }

  // Write back to .env
  fs.writeFileSync(envPath, envContent.trim() + "\n");
};
```

3. Init Command Integration:

```typescript
program
  .command("init")
  .description("Initialize a new project")
  .argument("<projectName>", "The project to initialize")
  .action(async (projectName) => {
    try {
      // Existing initialization checks...

      // Get OpenRouter configuration
      const config = await promptForOpenRouterConfig();

      // Existing AI tools selection...
      const aiToolsSelection = await promptForAITools();

      // Copy templates and setup rules
      await copyBuildforceTemplate(process.cwd(), aiToolsSelection);

      // Update environment configuration
      await updateEnvFile(config.apiKey, config.model);

      console.log(
        "Successfully initialized project with OpenRouter configuration"
      );
    } catch (error) {
      console.error("Error initializing project:", error);
      process.exit(1);
    }
  });
```

## Testing / Verification Steps

1. Interactive Prompts:

   - Test API key validation
   - Verify default model is provided
   - Test input cancellation handling

2. Environment File Management:

   - Test creating new .env file
   - Test updating existing .env file
   - Verify file permissions are set correctly
   - Check line ending consistency

3. Error Handling:

   - Test file system error handling
   - Verify user-friendly error messages
   - Check error recovery behavior

4. Integration Testing:
   - Test full initialization flow
   - Verify configuration persistence
   - Check interaction with other init features
