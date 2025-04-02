# Task: Update System Prompt

## Overview

Update the system prompt to include the current active session context and tool descriptions, allowing the planning agent to make informed decisions about session management.

## Sub-Tasks

- [ ] Create Session Context Template

  - [ ] Define session context structure
  - [ ] Add active session information
  - [ ] Include project context
  - [ ] Add tool descriptions

- [ ] Update System Prompt

  - [ ] Integrate session context
  - [ ] Add tool usage examples
  - [ ] Update agent capabilities
  - [ ] Add error handling guidance

- [ ] Testing
  - [ ] Create test utilities
  - [ ] Add unit tests for prompt generation
  - [ ] Test with different session states
  - [ ] Verify tool integration

## Implementation Plan

### 1. Session Context Template

```typescript
// src/agents/planning/prompts.ts
import { z } from "zod";

export const SessionContextSchema = z.object({
  activeSession: z.object({
    id: z.string(),
    name: z.string(),
    status: z.enum(["planned", "in_progress", "completed"]),
    tasks: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        status: z.enum(["pending", "in_progress", "completed"]),
      })
    ),
  }),
  projectContext: z.object({
    name: z.string(),
    description: z.string(),
    currentPhase: z.string(),
  }),
});

export type SessionContext = z.infer<typeof SessionContextSchema>;

export const createSessionContext = (context: SessionContext): string => {
  return `
Current Session Context:
- Session ID: ${context.activeSession.id}
- Session Name: ${context.activeSession.name}
- Status: ${context.activeSession.status}
- Tasks:
${context.activeSession.tasks
  .map((task) => `  - ${task.name} (${task.status})`)
  .join("\n")}

Project Context:
- Name: ${context.projectContext.name}
- Description: ${context.projectContext.description}
- Current Phase: ${context.projectContext.currentPhase}
`;
};
```

### 2. Updated System Prompt

```typescript
// src/agents/planning/prompts.ts
import { createSessionContext } from "./context";

export const SYSTEM_PROMPT = `You are an autonomous AI planning agent responsible for managing development sessions and tasks.

${createSessionContext(context)}

You have access to the following tools:

1. readFile(path: string)
   - Reads the contents of a file
   - Use this to examine existing code or documentation
   - Example: readFile("src/agents/planning/tools.ts")

2. writeFile(path: string, content: string)
   - Writes content to a file
   - Use this to create or update files
   - Example: writeFile("buildforce/sessions/planned/session-007/tasks/task-001.md", "# Task 1")

3. searchFiles(pattern: string)
   - Searches for files matching a pattern
   - Use this to find relevant files
   - Example: searchFiles("*.ts")

Your responsibilities:
1. Analyze the current session state
2. Create and manage tasks
3. Update task status
4. Generate documentation
5. Handle errors gracefully

When using tools:
- Always check file existence before reading
- Validate file paths
- Handle errors appropriately
- Document your actions

Remember:
- Keep tasks focused and manageable
- Update task status promptly
- Maintain clear documentation
- Follow the project's conventions`;
```

### 3. Testing

```typescript
// src/agents/planning/__tests__/prompts.test.ts
import { createSessionContext, SYSTEM_PROMPT } from "../prompts";
import { SessionContext } from "../types";

describe("System Prompt", () => {
  const mockContext: SessionContext = {
    activeSession: {
      id: "session-007",
      name: "Autonomous Planning",
      status: "planned",
      tasks: [
        { id: "task-001", name: "Implement File Tools", status: "pending" },
        { id: "task-002", name: "Update System Prompt", status: "pending" },
      ],
    },
    projectContext: {
      name: "BuildForce CLI",
      description: "A CLI tool for managing development sessions",
      currentPhase: "Planning",
    },
  };

  describe("createSessionContext", () => {
    it("should generate formatted context", () => {
      const context = createSessionContext(mockContext);
      expect(context).toContain("Session ID: session-007");
      expect(context).toContain("Session Name: Autonomous Planning");
      expect(context).toContain("Status: planned");
      expect(context).toContain("Tasks:");
      expect(context).toContain("- Implement File Tools (pending)");
      expect(context).toContain("- Update System Prompt (pending)");
      expect(context).toContain("Project Context:");
      expect(context).toContain("Name: BuildForce CLI");
      expect(context).toContain(
        "Description: A CLI tool for managing development sessions"
      );
      expect(context).toContain("Current Phase: Planning");
    });
  });

  describe("SYSTEM_PROMPT", () => {
    it("should include tool descriptions", () => {
      expect(SYSTEM_PROMPT).toContain("readFile(path: string)");
      expect(SYSTEM_PROMPT).toContain(
        "writeFile(path: string, content: string)"
      );
      expect(SYSTEM_PROMPT).toContain("searchFiles(pattern: string)");
    });

    it("should include responsibilities", () => {
      expect(SYSTEM_PROMPT).toContain("Analyze the current session state");
      expect(SYSTEM_PROMPT).toContain("Create and manage tasks");
      expect(SYSTEM_PROMPT).toContain("Update task status");
      expect(SYSTEM_PROMPT).toContain("Generate documentation");
      expect(SYSTEM_PROMPT).toContain("Handle errors gracefully");
    });

    it("should include tool usage guidelines", () => {
      expect(SYSTEM_PROMPT).toContain(
        "Always check file existence before reading"
      );
      expect(SYSTEM_PROMPT).toContain("Validate file paths");
      expect(SYSTEM_PROMPT).toContain("Handle errors appropriately");
      expect(SYSTEM_PROMPT).toContain("Document your actions");
    });
  });
});
```

## Dependencies

- Zod for schema validation
- Session management utilities
- Project context utilities
- Test infrastructure

## Notes

- Keep prompt clear and concise
- Include all necessary context
- Provide clear examples
- Document all changes
