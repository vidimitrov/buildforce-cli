# Buildforce CLI

A command-line interface tool for AI-assisted project planning and development workflows.

## Overview

Buildforce CLI is a developer tool that helps you plan and organize your coding sessions with the assistance of AI. It provides a structured approach to software development by breaking down projects into sessions, tasks, and subtasks, while maintaining comprehensive documentation of your development process.

The tool uses AI to analyze your project, help with planning, and guide you through implementation, making it easier to maintain a clear development history and project structure.

## Features

- **Project Initialization**: Set up Buildforce in your existing projects
- **AI-Assisted Planning**: Interactive planning sessions with AI guidance
- **Structured Documentation**: Automatically maintain development history and project documentation
- **Session Management**: Organize your work into sessions, tasks, and subtasks
- **Project Analysis**: Analyze your codebase to provide context-aware assistance

## Installation

```bash
# Install globally
npm install -g buildforce-cli

# Or use npx
npx buildforce-cli <command>
```

## Usage

### Initialize a Project

```bash
buildforce init <projectName> [options]
```

Options:
- `--skip-analysis`: Skip project analysis
- `--force`: Force initialization even if already initialized
- `--verbose`: Enable verbose output
- `--dev-mode`: Enable development mode

### Start a Planning Session

```bash
buildforce plan [options]
```

Options:
- `--api-key <key>`: Temporarily override the OpenRouter API key
- `--model <model>`: Temporarily override the OpenRouter model

During a planning session, you can interact with the AI to:
- Define session objectives
- Break down work into tasks
- Create implementation plans
- Document your development process

Type `EXIT` or `STOP` to end the planning session.

## Project Structure

When you initialize a project with Buildforce, it creates a structured directory:

```
buildforce/
├── README.md                # Main directory guide
├── rules.md                 # Rules for LLMs
├── memory/                  # Project intelligence
│   ├── specification.md     # Project requirements and vision
│   └── architecture.md      # Technical architecture and patterns
├── templates/               # Document templates
│   ├── session-template.eta # For session planning
│   ├── task-template.eta    # For task definition
│   └── *-template.eta       # Other supporting templates
└── sessions/                # Development tracking
    ├── .active-session      # Points to current active session
    ├── completed/           # Completed sessions and tasks
    └── planned/             # Planned sessions and tasks
```

## Development

### Building from Source

```bash
# Clone the repository
git clone https://github.com/your-username/buildforce-cli.git
cd buildforce-cli

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test
```

### Available Scripts

- `npm start`: Run the CLI in development mode
- `npm run build`: Build the TypeScript project
- `npm test`: Run all tests
- `npm run test:init`: Test initialization command
- `npm run test:plan`: Test planning command

## License

MIT

## Author

Veselin Dimitrov