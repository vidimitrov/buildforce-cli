# Task: Update System Prompt

## Overview

Update the system prompt to include the current active session context and tool descriptions, enabling the planning agent to make better decisions about session management.

## Sub-Tasks

- [x] Create Session Context Template

  - [x] Define context schema
  - [x] Add active session info
  - [x] Include chat history
  - [x] Add task progress

- [x] Update System Prompt

  - [x] Add tool descriptions
  - [x] Include usage examples
  - [x] Maintain existing context
  - [x] Add workflow guidance

- [x] Testing
  - [x] Verify context generation
  - [x] Test prompt formatting
  - [x] Check tool descriptions
  - [x] Validate examples

## Implementation Plan

### 1. Session Context Schema

```typescript
// src/agents/planning/types.ts
import { z } from "zod";

export const SessionContextSchema = z.object({
  activeSession: z.object({
    number: z.number(),
    name: z.string(),
    path: z.string(),
  }),
  chatHistory: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string(),
      timestamp: z.string(),
    })
  ),
  taskProgress: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      completed: z.boolean(),
    })
  ),
});

export type SessionContext = z.infer<typeof SessionContextSchema>;
```

### 2. Context Generation

```typescript
// src/agents/planning/context.ts
import { SessionContext } from "./types";
import { readContextFile } from "../../services/filesystem";

export async function createSessionContext(): Promise<string> {
  const activeSession = readContextFile("buildforce/sessions/.active-session");
  const sessionPath = `buildforce/sessions/planned/${activeSession}`;
  const sessionMd = readContextFile(`${sessionPath}/session.md`);
  const chatHistory = readContextFile(`${sessionPath}/.chat-history.md`);

  const context: SessionContext = {
    activeSession: {
      number: parseInt(activeSession.split("-")[1]),
      name: activeSession.split("-").slice(2).join("-"),
      path: sessionPath,
    },
    chatHistory: parseChatHistory(chatHistory),
    taskProgress: parseTaskProgress(sessionMd),
  };

  return formatSessionContext(context);
}

function formatSessionContext(context: SessionContext): string {
  return `
# Active Session Context

## Current Session
- Number: ${context.activeSession.number}
- Name: ${context.activeSession.name}
- Path: ${context.activeSession.path}

## Task Progress
${context.taskProgress
  .map((task) => `- [${task.completed ? "x" : " "}] ${task.name}`)
  .join("\n")}

## Recent Chat History
${context.chatHistory
  .slice(-5)
  .map((msg) => `${msg.role}: ${msg.content}`)
  .join("\n")}
`;
}
```

### 3. Updated System Prompt

```typescript
// src/agents/planning/agent.ts
const buildSystemPrompt = (): string => {
  const buildforceRules = readContextFile("buildforce/rules.md");
  const architecture = readContextFile("buildforce/memory/architecture.md");
  const specification = readContextFile("buildforce/memory/specification.md");
  const sessionContext = createSessionContext();

  return `You are a planning agent that follows the Buildforce workflow rules.

# Buildforce Rules
${buildforceRules}

# Project Architecture
${architecture}

# Project Specification
${specification}

# Active Session Context
${sessionContext}

Your goal is to brainstorm with the user about the session they are about to start, and once all the needed information is in place, to construct a detailed plan and create the needed session files as described in the Buildforce rules. Be friendly and engaging, and refer back to previous messages in the conversation to maintain context.

When starting a new conversation, ask the user what they are planning to work on next in a friendly and engaging way.

You have access to the following tools:
- readFile: Read the contents of a file
- writeFile: Write content to a file
- searchFiles: Search for files matching a pattern

Use these tools to help you understand the project structure and create session files as needed. For example:
1. Use searchFiles to find the next available session number in buildforce/sessions/planned
2. Use readFile to read the session template from buildforce/templates/session-template.md
3. Use writeFile to create the new session files in the correct structure

Remember to follow the Buildforce rules for file organization and naming conventions.`;
};
```

## Testing

### Unit Tests

```typescript
// src/agents/planning/__tests__/context.test.ts
import { createSessionContext } from "../context";
import { readContextFile } from "../../../services/filesystem";

jest.mock("../../../services/filesystem");

describe("Session Context", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should generate session context", async () => {
    (readContextFile as jest.Mock).mockImplementation((path) => {
      switch (path) {
        case "buildforce/sessions/.active-session":
          return "session-001-initial-setup";
        case "buildforce/sessions/planned/session-001-initial-setup/session.md":
          return "# Session\n\n## Tasks\n- [ ] Task 1\n- [x] Task 2";
        case "buildforce/sessions/planned/session-001-initial-setup/.chat-history.md":
          return "## 2024-03-20T10:00:00Z | User\nHello\n## 2024-03-20T10:01:00Z | Assistant\nHi!";
        default:
          return "";
      }
    });

    const context = await createSessionContext();
    expect(context).toContain("Session-001-initial-setup");
    expect(context).toContain("[ ] Task 1");
    expect(context).toContain("[x] Task 2");
    expect(context).toContain("Hello");
    expect(context).toContain("Hi!");
  });
});
```

## Dependencies

- Zod for schema validation
- File system utilities
- Test infrastructure

## Notes

- Keep context concise
- Maintain clear formatting
- Consider future extensibility
- Document all changes

## Recap

### Completed Implementation

1. **Session Context**

   - Created SessionContextSchema with Zod
   - Implemented context generation
   - Added chat history parsing
   - Added task progress tracking

2. **System Prompt**

   - Updated with tool descriptions
   - Added usage examples
   - Maintained existing context
   - Added workflow guidance

3. **Testing**
   - Added unit tests for context generation
   - Verified prompt formatting
   - Tested tool descriptions
   - Validated examples

### Key Decisions

1. **Context Structure**

   - Used Zod for schema validation
   - Included essential session info
   - Added recent chat history
   - Tracked task progress

2. **Prompt Enhancement**
   - Added clear tool descriptions
   - Included practical examples
   - Maintained existing context
   - Added workflow guidance

### Next Steps

- Monitor context generation
- Gather feedback on prompt clarity
- Consider additional context fields
- Update documentation as needed
