# Task: Implement File Tools

## Overview

Implement file operation tools (read/write/search) following the same pattern as the example tool in `tools.ts`. These tools will allow the planning agent to autonomously interact with the file system.

## Sub-Tasks

- [ ] Create Read File Tool

  - [ ] Define tool schema with Zod
  - [ ] Implement file reading logic
  - [ ] Add error handling
  - [ ] Add proper documentation

- [ ] Create Write File Tool

  - [ ] Define tool schema with Zod
  - [ ] Implement file writing logic
  - [ ] Add error handling
  - [ ] Add proper documentation

- [ ] Create Search Files Tool

  - [ ] Define tool schema with Zod
  - [ ] Implement file searching logic
  - [ ] Add error handling
  - [ ] Add proper documentation

- [ ] Testing
  - [ ] Create test utilities
  - [ ] Add unit tests for each tool
  - [ ] Add integration tests
  - [ ] Test error scenarios

## Implementation Plan

### 1. Read File Tool

```typescript
// src/agents/planning/tools.ts
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { readFile } from "../../services/filesystem";

export const readFileTool = tool(
  async ({ path }) => {
    try {
      return await readFile(path);
    } catch (error) {
      throw new Error(`Failed to read file: ${error.message}`);
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
```

### 2. Write File Tool

```typescript
// src/agents/planning/tools.ts
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { writeFile } from "../../services/filesystem";

export const writeFileTool = tool(
  async ({ path, content }) => {
    try {
      await writeFile(path, content);
      return "File written successfully";
    } catch (error) {
      throw new Error(`Failed to write file: ${error.message}`);
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
```

### 3. Search Files Tool

```typescript
// src/agents/planning/tools.ts
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { searchFiles } from "../../services/filesystem";

export const searchFilesTool = tool(
  async ({ pattern }) => {
    try {
      return await searchFiles(pattern);
    } catch (error) {
      throw new Error(`Failed to search files: ${error.message}`);
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

## Testing

### Unit Tests

```typescript
// src/agents/planning/__tests__/tools.test.ts
import { readFileTool, writeFileTool, searchFilesTool } from "../tools";
import { readFile, writeFile, searchFiles } from "../../../services/filesystem";

jest.mock("../../../services/filesystem");

describe("File Tools", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("readFileTool", () => {
    it("should read file contents", async () => {
      const mockContent = "test content";
      (readFile as jest.Mock).mockResolvedValue(mockContent);

      const result = await readFileTool.call({ path: "test.txt" });
      expect(result).toBe(mockContent);
      expect(readFile).toHaveBeenCalledWith("test.txt");
    });

    it("should handle errors", async () => {
      const error = new Error("File not found");
      (readFile as jest.Mock).mockRejectedValue(error);

      await expect(readFileTool.call({ path: "test.txt" })).rejects.toThrow(
        "Failed to read file: File not found"
      );
    });
  });

  describe("writeFileTool", () => {
    it("should write file contents", async () => {
      (writeFile as jest.Mock).mockResolvedValue(undefined);

      const result = await writeFileTool.call({
        path: "test.txt",
        content: "test content",
      });

      expect(result).toBe("File written successfully");
      expect(writeFile).toHaveBeenCalledWith("test.txt", "test content");
    });

    it("should handle errors", async () => {
      const error = new Error("Permission denied");
      (writeFile as jest.Mock).mockRejectedValue(error);

      await expect(
        writeFileTool.call({
          path: "test.txt",
          content: "test content",
        })
      ).rejects.toThrow("Failed to write file: Permission denied");
    });
  });

  describe("searchFilesTool", () => {
    it("should search for files", async () => {
      const mockFiles = ["file1.txt", "file2.txt"];
      (searchFiles as jest.Mock).mockResolvedValue(mockFiles);

      const result = await searchFilesTool.call({ pattern: "*.txt" });
      expect(result).toEqual(mockFiles);
      expect(searchFiles).toHaveBeenCalledWith("*.txt");
    });

    it("should handle errors", async () => {
      const error = new Error("Invalid pattern");
      (searchFiles as jest.Mock).mockRejectedValue(error);

      await expect(searchFilesTool.call({ pattern: "*.txt" })).rejects.toThrow(
        "Failed to search files: Invalid pattern"
      );
    });
  });
});
```

## Dependencies

- LangChain core tools
- Zod for schema validation
- File system utilities
- Test infrastructure

## Notes

- Keep tools simple and focused
- Maintain good error messages
- Consider future extensibility
- Document all changes
