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
- **plan**: Start planning a new coding session
  - Includes initialization check and prompt for uninitialized projects
  - Seamless continuation to planning after initialization

## Notes

- Basic test infrastructure implemented for initialization checks
- Binary is exposed as "buildforce" command when installed
- AI tools integration allows for seamless setup of rule files for different AI-assisted coding tools
