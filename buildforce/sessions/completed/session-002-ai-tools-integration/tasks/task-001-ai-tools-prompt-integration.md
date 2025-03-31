# Task 1: AI Tools Prompt Integration

## Architecture context

The buildforce-cli is a command-line tool for managing Buildforce projects. It provides initialization capabilities that set up the necessary file structure for a new project.

## Specification context

The tool needs to support various AI-assisted coding tools by copying appropriate rule files during initialization.

## RULES

- Follow the existing code style and patterns
- Ensure proper error handling
- Respect existing user files
- Provide clear feedback to users

## Sub-Tasks & Progress Tracking

- [x] Install inquirer package for interactive prompts
- [x] Modify promptForInitialization to include AI tools selection
- [x] Implement setupAIToolsRules function
- [x] Implement helper functions for each tool (Cursor, Cline, Windsurf)
- [x] Add proper error handling
- [x] Test with various scenarios

## Recap

The AI Tools Prompt Integration task has been successfully completed. The following changes were implemented:

1. Added the inquirer package for interactive prompts
2. Modified the initialization process to include AI tools selection with all options checked by default
3. Implemented the setupAIToolsRules function to handle the selected tools
4. Created helper functions for each tool:
   - setupCursorRules: Copies buildforce.mdc to .cursor/rules/
   - setupClineRules: Copies or appends to .clinerules
   - setupWindsurfRules: Copies or appends to .windsurfrules
5. Added proper error handling for all file operations
6. Added a check for already initialized projects with a clear message
7. Ensured existing files are respected by appending content rather than overwriting

All the functionality has been tested and verified to work correctly with various scenarios, including:

- Initializing with no existing rule files
- Initializing with existing rule files
- Testing with different combinations of AI tools

## Overview

This task involves enhancing the initialization process to ask users which AI-assisted coding tools they use (Cline, Cursor, Windsurf) and copy the appropriate rule files to the repository root based on their selection.

## Implementation Plan

### BACK-END IMPLEMENTATION

1. Dependencies:

   - Add inquirer package for interactive prompts

2. Initialization Flow:

   - Modify promptForInitialization to include AI tools selection
   - Create setupAIToolsRules function to handle selected tools
   - Implement helper functions for each tool

3. File Operations:

   - For Cursor: Copy buildforce.mdc to .cursor/rules/
   - For Cline: Copy/append .clinerules
   - For Windsurf: Copy/append .windsurfrules

4. Error Handling:
   - Handle file system errors
   - Provide clear error messages

## Data Models

```typescript
// AI Tools selection interface
interface AIToolsSelection {
  selectedTools: string[]; // Array of selected tools: 'cursor', 'cline', 'windsurf'
}
```

## Testing / Verification Steps

1. Initialize with no existing rule files:

   - Run `buildforce init test-project`
   - Select various combinations of AI tools
   - Verify correct files are created

2. Initialize with existing rule files:

   - Create test directories with existing rule files
   - Run initialization
   - Verify files are updated correctly

3. Error handling:
   - Test with read-only directories
   - Verify proper error messages
