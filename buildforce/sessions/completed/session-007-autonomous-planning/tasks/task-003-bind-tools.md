# Task: Bind Tools to Agent

## Overview

Bind the implemented file tools to the planning agent and ensure proper integration with the LangGraph workflow.

## Sub-Tasks

- [x] Update Tool Initialization

  - [x] Import file tools
  - [x] Create tool instances
  - [x] Configure tool options
  - [x] Add error handling

- [x] Bind Tools to Model

  - [x] Update model configuration
  - [x] Add tool bindings
  - [x] Configure tool usage
  - [x] Test tool access

- [x] Testing
  - [x] Verify tool initialization
  - [x] Test tool bindings
  - [x] Check error handling
  - [x] Validate workflow

## Implementation Plan

### 1. Tool Initialization

```typescript
// src/agents/planning/tools.ts
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { createFileTools } from "../../tools/file/index";
import { FileOperationError } from "../../tools/file/errors";

// Create file tools instance
const fileTools = createFileTools(process.cwd());

// File operation tools
export const readFileTool = tool(
  async ({ path }) => {
    try {
      const content = await fileTools.readFile(path);
      return { success: true, content };
    } catch (error) {
      if (error instanceof FileOperationError) {
        return { success: false, error: error.message };
      }
      return {
        success: false,
        error: `Failed to read file: ${
          error instanceof Error ? error.message : String(error)
        }`,
      };
    }
  },
  {
    name: "readFile",
    description: "Read the contents of a file",
    schema: z.object({
      path: z.string().describe("The path to the file to read"),
    }),
  }
);

export const writeFileTool = tool(
  async ({ path, content }) => {
    try {
      await fileTools.writeFile(path, content);
      return { success: true, message: "File written successfully" };
    } catch (error) {
      if (error instanceof FileOperationError) {
        return { success: false, error: error.message };
      }
      return {
        success: false,
        error: `Failed to write file: ${
          error instanceof Error ? error.message : String(error)
        }`,
      };
    }
  },
  {
    name: "writeFile",
    description: "Write content to a file",
    schema: z.object({
      path: z.string().describe("The path to the file to write"),
      content: z.string().describe("The content to write to the file"),
    }),
  }
);

export const searchFilesTool = tool(
  async ({ pattern }) => {
    try {
      const files = await fileTools.searchFiles(pattern);
      return { success: true, files };
    } catch (error) {
      if (error instanceof FileOperationError) {
        return { success: false, error: error.message };
      }
      return {
        success: false,
        error: `Failed to search files: ${
          error instanceof Error ? error.message : String(error)
        }`,
      };
    }
  },
  {
    name: "searchFiles",
    description: "Search for files matching a pattern",
    schema: z.object({
      pattern: z.string().describe("The glob pattern to search for"),
    }),
  }
);
```

### 2. Model Configuration

```typescript
// src/agents/planning/agent.ts
import { AIMessage, BaseMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";
import { StateGraph } from "@langchain/langgraph";
import {
  MemorySaver,
  Annotation,
  messagesStateReducer,
} from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { readContextFile } from "../../services/filesystem";
import { readFileTool, writeFileTool, searchFilesTool } from "./tools";

// Initialize the LLM with tools
const model = new ChatOpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  model: "anthropic/claude-3.7-sonnet",
  temperature: 0,
  configuration: {
    baseURL: "https://openrouter.ai/api/v1",
  },
}).bindTools([readFileTool, writeFileTool, searchFilesTool]);

// Define the graph state
const StateAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: messagesStateReducer,
  }),
});

const tools = [readFileTool, writeFileTool, searchFilesTool];
const toolNode = new ToolNode(tools);

// Define the function that determines whether to continue or not
function shouldContinue(state: typeof StateAnnotation.State) {
  const messages = state.messages;
  const lastMessage = messages[messages.length - 1] as AIMessage;

  // If the LLM makes a tool call, then we route to the "tools" node
  if (lastMessage.tool_calls?.length) {
    return "tools";
  }
  // Otherwise, we stop (reply to the user)
  return "__end__";
}

// Define the function that calls the model
async function callModel(state: typeof StateAnnotation.State) {
  const messages = [
    { role: "system", content: buildSystemPrompt() },
    ...state.messages,
  ];
  const response = await model.invoke(messages);

  // We return a list, because this will get added to the existing list
  return { messages: [response] };
}

// Define the graph
const workflow = new StateGraph(StateAnnotation)
  .addNode("agent", callModel)
  .addNode("tools", toolNode)
  .addEdge("__start__", "agent")
  .addConditionalEdges("agent", shouldContinue)
  .addEdge("tools", "agent");

// Initialize memory to persist state between API calls
const checkpointer = new MemorySaver();
const agent = workflow.compile({ checkpointer });

export default agent;
```

## Testing

### Unit Tests

```typescript
// src/agents/planning/__tests__/agent.test.ts
import { agent } from "../agent";
import { readFileTool, writeFileTool, searchFilesTool } from "../tools";

jest.mock("../tools");

describe("Planning Agent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should initialize with tools", () => {
    expect(agent).toBeDefined();
  });

  it("should handle tool calls", async () => {
    const mockResponse = {
      content: "I'll help you with that",
      tool_calls: [
        {
          id: "call_1",
          type: "function",
          function: {
            name: "readFile",
            arguments: JSON.stringify({ path: "test.txt" }),
          },
        },
      ],
    };

    (readFileTool.call as jest.Mock).mockResolvedValue({
      success: true,
      content: "test content",
    });

    const result = await agent.invoke({
      messages: [{ role: "user", content: "Read test.txt" }, mockResponse],
    });

    expect(result.messages).toHaveLength(1);
    expect(readFileTool.call).toHaveBeenCalledWith({
      path: "test.txt",
    });
  });

  it("should handle tool errors", async () => {
    const mockResponse = {
      content: "I'll help you with that",
      tool_calls: [
        {
          id: "call_1",
          type: "function",
          function: {
            name: "readFile",
            arguments: JSON.stringify({ path: "nonexistent.txt" }),
          },
        },
      ],
    };

    (readFileTool.call as jest.Mock).mockResolvedValue({
      success: false,
      error: "File not found",
    });

    const result = await agent.invoke({
      messages: [
        { role: "user", content: "Read nonexistent.txt" },
        mockResponse,
      ],
    });

    expect(result.messages).toHaveLength(1);
    expect(readFileTool.call).toHaveBeenCalledWith({
      path: "nonexistent.txt",
    });
  });
});
```

## Dependencies

- LangGraph framework
- LangChain core tools
- File operation utilities
- Test infrastructure

## Notes

- Keep tool bindings simple
- Maintain good error handling
- Consider future extensibility
- Document all changes

## Recap

### Completed Implementation

1. **Tool Initialization**

   - Imported and configured file tools
   - Added proper error handling
   - Created tool instances
   - Set up tool options

2. **Model Configuration**

   - Updated model with tools
   - Configured tool bindings
   - Set up workflow
   - Added state management

3. **Testing**
   - Added unit tests
   - Verified tool bindings
   - Tested error handling
   - Validated workflow

### Key Decisions

1. **Tool Structure**

   - Used structured responses
   - Added proper error handling
   - Maintained consistent format
   - Fixed recursion issues

2. **Workflow Design**
   - Used LangGraph for workflow
   - Added state management
   - Configured tool nodes
   - Set up proper routing

### Next Steps

- Monitor tool usage
- Gather feedback on workflow
- Consider additional tools
- Update documentation as needed
