# Task 004: Improve System Prompt with Rules and Context

## Architecture context

The CLI tool currently uses a basic system prompt for the LLM:

- Simple "You're a helpful assistant" message
- No project-specific context
- No awareness of Buildforce rules
- No access to chat history

## Specification context

The system needs to provide comprehensive context to the LLM to ensure proper planning and documentation:

- Include Buildforce workflow rules
- Maintain project architecture context
- Track project specifications
- Preserve chat history
- Guide the LLM in session planning and file creation

## RULES

1. Include all required context files
2. Update prompt dynamically
3. Maintain chat history
4. Follow TypeScript best practices
5. Handle file reading errors gracefully
6. Keep code modular and maintainable

## Sub-Tasks & Progress Tracking

- [x] Add file reading utilities for context files
- [x] Implement chat history tracking
- [x] Create comprehensive system prompt
- [x] Add error handling for file operations
- [x] Update askModel function
- [x] Test prompt effectiveness

## Recap

All subtasks have been completed successfully:

1. Context Management:

   - Implemented readContextFile utility
   - Added support for all context files (rules.md, architecture.md, specification.md)
   - Added proper error handling with fallbacks

2. Chat History:

   - Implemented chat history tracking
   - Added proper timestamp formatting
   - Added role-based message tracking
   - Implemented secure file operations

3. System Prompt:

   - Created comprehensive prompt structure
   - Integrated all context sources
   - Added clear goal statement
   - Improved readability and organization

4. Integration:
   - Updated askModel function
   - Added proper error handling
   - Verified prompt effectiveness
   - Added loading state indicators

## Overview

Update the system prompt to include Buildforce rules, project context, and chat history, making the LLM more effective at planning sessions and creating documentation.

## Implementation Plan

### System Prompt Implementation

1. Context File Reading:

```typescript
const readContextFile = (filePath: string, defaultContent = ""): string => {
  try {
    return fs.readFileSync(path.join(process.cwd(), filePath), "utf8");
  } catch (error) {
    console.warn(`Warning: Could not read ${filePath}:`, error);
    return defaultContent;
  }
};

const getActiveSessionPath = (): string | null => {
  const activeSessionFilePath = path.join(
    process.cwd(),
    "buildforce",
    "sessions",
    ".active-session"
  );

  try {
    if (fs.existsSync(activeSessionFilePath)) {
      const activeSession = fs
        .readFileSync(activeSessionFilePath, "utf8")
        .trim();
      if (activeSession) {
        return path.join(
          process.cwd(),
          "buildforce",
          "sessions",
          activeSession
        );
      }
    }
    return null;
  } catch (error) {
    console.warn("Warning: Could not read active session:", error);
    return null;
  }
};

const getChatHistory = (): string => {
  const activeSessionPath = getActiveSessionPath();
  if (activeSessionPath) {
    const chatHistoryPath = path.join(activeSessionPath, ".chat-history.md");
    try {
      if (fs.existsSync(chatHistoryPath)) {
        return fs.readFileSync(chatHistoryPath, "utf8");
      }
    } catch (error) {
      console.warn("Warning: Could not read chat history:", error);
    }
  }
  return "No chat history available.";
};
```

2. System Prompt Construction:

```typescript
const buildSystemPrompt = (): string => {
  const buildforceRules = readContextFile("buildforce/rules.md");
  const architecture = readContextFile("buildforce/memory/architecture.md");
  const specification = readContextFile("buildforce/memory/specification.md");
  const chatHistory = getChatHistory();

  return `You are a planning agent that follows the Buildforce workflow rules.

# Buildforce Rules
${buildforceRules}

# Project Architecture
${architecture}

# Project Specification
${specification}

# Current Chat History
${chatHistory}

Your goal is to brainstorm with the user about the session they are about to start, and once all the needed information is in place, to construct a detailed plan and create the needed session files as described in the Buildforce rules. Remember to update the .chat-history file with every message from both you and the user.`;
};
```

3. Update Ask Model Function:

```typescript
const askModel = async (input: string, model: ChatOpenAI) => {
  const prompt = ChatPromptTemplate.fromMessages([
    new SystemMessage(buildSystemPrompt()),
    new HumanMessage(input),
  ]);

  const parser = new StringOutputParser();
  const chain = prompt.pipe(model).pipe(parser);

  return await chain.invoke(input);
};
```

4. Chat History Update Function:

```typescript
const updateChatHistory = async (
  role: "User" | "Assistant",
  content: string
): Promise<void> => {
  const activeSessionPath = getActiveSessionPath();
  if (!activeSessionPath) {
    console.warn("Warning: No active session to update chat history");
    return;
  }

  const chatHistoryPath = path.join(activeSessionPath, ".chat-history.md");
  const timestamp = new Date().toISOString();
  const entry = `\n## ${timestamp} | ${role}\n\n${content}\n`;

  try {
    fs.appendFileSync(chatHistoryPath, entry);
  } catch (error) {
    console.error("Error updating chat history:", error);
    throw error;
  }
};
```

## Testing / Verification Steps

1. Context Loading:

   - Test reading all context files
   - Verify error handling for missing files
   - Check content formatting

2. Chat History:

   - Test history tracking
   - Verify timestamp format
   - Check file append operations
   - Test error handling

3. System Prompt:

   - Verify all sections are included
   - Check formatting and readability
   - Test with missing context files
   - Verify goal statement is clear

4. Integration Testing:
   - Test full conversation flow
   - Verify context affects responses
   - Check history updates
   - Test error recovery
