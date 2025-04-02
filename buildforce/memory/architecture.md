# Buildforce CLI - Technical Architecture

## Overview

Buildforce CLI is a command-line interface tool designed to provide access to Buildforce planning capabilities. The tool is built with TypeScript and integrates with LangChain for AI/LLM functionality.

## Tech Stack

- **Core Language**: TypeScript
- **Runtime Environment**: Node.js
- **Key Libraries**:
  - @langchain/core & @langchain/openai: AI/LLM integration
  - commander: CLI framework
  - dotenv: Environment configuration
  - inquirer: Interactive command-line prompts

## Project Structure

```
buildforce-cli/
├── src/                    # Source code directory
│   ├── index.ts           # Main entry point
│   └── templates/         # Template files
│       ├── buildforce/    # Buildforce template files
│       └── rules/         # AI tools rule templates
│           ├── .cursor/   # Cursor rule templates
│           ├── .clinerules # Cline rule template
│           └── .windsurfrules # Windsurf rule template
├── dist/                  # Compiled output
├── buildforce/          # Project documentation and rules
└── configuration files   # Various config files (package.json, tsconfig.json, etc.)
```

### Automatic Onboarding System

The project includes an automatic onboarding system that generates project documentation during the `buildforce init` command. This system consists of:

1. **InitAgent**: A dedicated agent that handles the initialization process

   - Analyzes project structure and dependencies
   - Generates architecture.md and specification.md
   - Provides user feedback and error handling

2. **Analysis System**: A chunked analysis approach that:

   - Breaks down project analysis into manageable chunks
   - Prioritizes chunks based on relevance
   - Processes chunks in order until sufficient information is gathered

3. **Documentation Generation**:
   - Uses Eta templates for dynamic content generation
   - Focuses on documentation and configuration files first
   - Allows for manual review and refinement
   - Maintains clear stopping criteria for analysis

The system is designed to be modular and extensible, with proper error handling and comprehensive test coverage.

## Build Management

- **Build Tool**: TypeScript Compiler (tsc)
- **Build Process**:
  1. Compile TypeScript to JavaScript
  2. Copy templates to dist directory
- **Development Mode**: ts-node for direct TypeScript execution

## Configuration

- Environment variables via .env file
- TypeScript configuration in tsconfig.json
- Package management through npm/package.json

## Development Workflow

1. Local development using `npm start`
2. Building for distribution using `npm run build`
3. CLI is made available through the bin configuration in package.json

## Command Structure

- **init**: Initialize a new project with the Buildforce template
  - Includes AI tools selection (Cursor, Cline, Windsurf)
  - Sets up appropriate rule files based on selection
  - Handles existing files by appending content rather than overwriting
  - Checks for already initialized projects
  - Interactive OpenRouter configuration with validation
- **plan**: Start planning a new coding session
  - Includes initialization check and prompt for uninitialized projects
  - Seamless continuation to planning after initialization
  - Supports temporary model/key overrides via command options
  - Automatic session management with chat history
  - Context-aware system prompts with project memory

## Model Configuration

- **Environment Variables**: OpenRouter configuration via OPENROUTER\_\* variables
  - OPENROUTER_API_KEY: API key for authentication
  - OPENROUTER_MODEL: Model selection (defaults to claude-3.7-sonnet:thinking)
- **Override Options**: Temporary configuration via command options
  - --api-key: Override API key for current session
  - --model: Override model for current session

## Testing Infrastructure

- Comprehensive test suite for core functionality
- Test utilities for temporary directory management
- Individual test commands for specific features
- Automated verification of command behavior
