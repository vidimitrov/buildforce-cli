# Task: Bind Tools to Agent

## Overview

Bind the file operation tools to the planning agent's model and update the agent's configuration to use these tools effectively.

## Sub-Tasks

- [ ] Update Agent Configuration

  - [ ] Import file tools
  - [ ] Configure tool binding
  - [ ] Update model settings
  - [ ] Add error handling

- [ ] Update Agent State

  - [ ] Add tool state management
  - [ ] Implement tool result handling
  - [ ] Add state persistence
  - [ ] Handle tool errors

- [ ] Testing
  - [ ] Create test utilities
  - [ ] Add unit tests for tool binding
  - [ ] Test tool execution
  - [ ] Verify error handling

## Implementation Plan

### 1. Update Agent Configuration

```typescript
// src/agents/planning/agent.ts
import { ChatOpenAI } from "@langchain/openai";
import { AgentExecutor, createOpenAIFunctionsAgent } from "langchain/agents";
import { readFileTool, writeFileTool, searchFilesTool } from "./tools";
import { SYSTEM_PROMPT } from "./prompts";
import { SessionContext } from "./types";

export class PlanningAgent {
  private model: ChatOpenAI;
  private executor: AgentExecutor;
  private context: SessionContext;

  constructor(context: SessionContext) {
    this.context = context;
    this.model = new ChatOpenAI({
      modelName: "gpt-4-turbo-preview",
      temperature: 0.7,
    });

    const tools = [readFileTool, writeFileTool, searchFilesTool];
    const prompt = SYSTEM_PROMPT.replace(
      "${createSessionContext(context)}",
      createSessionContext(context)
    );

    const agent = createOpenAIFunctionsAgent({
      llm: this.model,
      tools,
      prompt,
    });

    this.executor = AgentExecutor.fromAgentAndTools({
      agent,
      tools,
      verbose: true,
      maxIterations: 10,
      returnIntermediateSteps: false,
    });
  }

  async execute(input: string): Promise<string> {
    try {
      const result = await this.executor.invoke({
        input,
      });

      return result.output;
    } catch (error) {
      console.error("Error executing agent:", error);
      throw new Error(`Failed to execute agent: ${error.message}`);
    }
  }
}
```

### 2. Update Agent State

```typescript
// src/agents/planning/state.ts
import { z } from "zod";
import { readFile, writeFile } from "../../services/filesystem";

export const AgentStateSchema = z.object({
  lastToolUsed: z.string().optional(),
  lastToolResult: z.string().optional(),
  lastError: z.string().optional(),
  toolHistory: z.array(
    z.object({
      tool: z.string(),
      result: z.string(),
      timestamp: z.string(),
    })
  ),
});

export type AgentState = z.infer<typeof AgentStateSchema>;

export class AgentStateManager {
  private state: AgentState;
  private statePath: string;

  constructor(statePath: string) {
    this.statePath = statePath;
    this.state = {
      toolHistory: [],
    };
  }

  async loadState(): Promise<void> {
    try {
      const content = await readFile(this.statePath);
      this.state = JSON.parse(content);
    } catch (error) {
      console.warn("No existing state found, starting fresh");
    }
  }

  async saveState(): Promise<void> {
    try {
      await writeFile(this.statePath, JSON.stringify(this.state, null, 2));
    } catch (error) {
      console.error("Failed to save state:", error);
      throw new Error(`Failed to save state: ${error.message}`);
    }
  }

  updateToolUsage(tool: string, result: string): void {
    this.state.lastToolUsed = tool;
    this.state.lastToolResult = result;
    this.state.toolHistory.push({
      tool,
      result,
      timestamp: new Date().toISOString(),
    });
  }

  setError(error: string): void {
    this.state.lastError = error;
  }

  getState(): AgentState {
    return { ...this.state };
  }
}
```

### 3. Testing

```typescript
// src/agents/planning/__tests__/agent.test.ts
import { PlanningAgent } from "../agent";
import { AgentStateManager } from "../state";
import { readFileTool, writeFileTool, searchFilesTool } from "../tools";
import { SessionContext } from "../types";

jest.mock("../tools");
jest.mock("../state");

describe("PlanningAgent", () => {
  let agent: PlanningAgent;
  let mockContext: SessionContext;
  let mockStateManager: jest.Mocked<AgentStateManager>;

  beforeEach(() => {
    mockContext = {
      activeSession: {
        id: "session-007",
        name: "Autonomous Planning",
        status: "planned",
        tasks: [],
      },
      projectContext: {
        name: "BuildForce CLI",
        description: "A CLI tool for managing development sessions",
        currentPhase: "Planning",
      },
    };

    mockStateManager = {
      loadState: jest.fn(),
      saveState: jest.fn(),
      updateToolUsage: jest.fn(),
      setError: jest.fn(),
      getState: jest.fn(),
    } as any;

    agent = new PlanningAgent(mockContext);
  });

  describe("execute", () => {
    it("should execute agent with tools", async () => {
      const mockResult = "Task completed successfully";
      (agent as any).executor.invoke = jest.fn().mockResolvedValue({
        output: mockResult,
      });

      const result = await agent.execute("Create a new task");
      expect(result).toBe(mockResult);
      expect((agent as any).executor.invoke).toHaveBeenCalledWith({
        input: "Create a new task",
      });
    });

    it("should handle errors", async () => {
      const error = new Error("Agent execution failed");
      (agent as any).executor.invoke = jest.fn().mockRejectedValue(error);

      await expect(agent.execute("Create a new task")).rejects.toThrow(
        "Failed to execute agent: Agent execution failed"
      );
    });
  });
});

describe("AgentStateManager", () => {
  let stateManager: AgentStateManager;

  beforeEach(() => {
    stateManager = new AgentStateManager("test-state.json");
  });

  describe("loadState", () => {
    it("should load existing state", async () => {
      const mockState = {
        lastToolUsed: "readFile",
        lastToolResult: "success",
        toolHistory: [],
      };

      (readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockState));

      await stateManager.loadState();
      expect(stateManager.getState()).toEqual(mockState);
    });

    it("should handle missing state file", async () => {
      (readFile as jest.Mock).mockRejectedValue(new Error("File not found"));
      await stateManager.loadState();
      expect(stateManager.getState()).toEqual({ toolHistory: [] });
    });
  });

  describe("saveState", () => {
    it("should save state to file", async () => {
      stateManager.updateToolUsage("readFile", "success");
      await stateManager.saveState();
      expect(writeFile).toHaveBeenCalledWith(
        "test-state.json",
        expect.stringContaining('"lastToolUsed":"readFile"')
      );
    });

    it("should handle save errors", async () => {
      (writeFile as jest.Mock).mockRejectedValue(new Error("Write failed"));
      await expect(stateManager.saveState()).rejects.toThrow(
        "Failed to save state: Write failed"
      );
    });
  });

  describe("updateToolUsage", () => {
    it("should update tool history", () => {
      stateManager.updateToolUsage("readFile", "success");
      const state = stateManager.getState();
      expect(state.lastToolUsed).toBe("readFile");
      expect(state.lastToolResult).toBe("success");
      expect(state.toolHistory).toHaveLength(1);
      expect(state.toolHistory[0]).toMatchObject({
        tool: "readFile",
        result: "success",
      });
    });
  });
});
```

## Dependencies

- LangChain core
- OpenAI API
- File system utilities
- Test infrastructure

## Notes

- Keep tool binding simple
- Maintain good error handling
- Consider state persistence
- Document all changes
