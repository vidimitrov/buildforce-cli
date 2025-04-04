# Task: Implement File Tools

## Overview

Implement file operation tools (read/write/search) following the same pattern as the example tool in `tools.ts`. These tools will allow the planning agent to autonomously interact with the file system.

## Sub-Tasks

- [x] Create Read File Tool

  - [x] Define tool schema with Zod
  - [x] Implement file reading logic
  - [x] Add error handling
  - [x] Add proper documentation

- [x] Create Write File Tool

  - [x] Define tool schema with Zod
  - [x] Implement file writing logic
  - [x] Add error handling
  - [x] Add proper documentation

- [x] Create Search Files Tool

  - [x] Define tool schema with Zod
  - [x] Implement file searching logic
  - [x] Add error handling
  - [x] Add proper documentation

- [x] Testing
  - [x] Create test utilities
  - [x] Add unit tests for each tool
  - [x] Add integration tests
  - [x] Test error scenarios

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
      const content = await readFile(path);
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
      const files = await searchFiles(pattern);
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
      expect(result).toEqual({ success: true, content: mockContent });
      expect(readFile).toHaveBeenCalledWith("test.txt");
    });

    it("should handle errors", async () => {
      const error = new Error("File not found");
      (readFile as jest.Mock).mockRejectedValue(error);

      const result = await readFileTool.call({ path: "test.txt" });
      expect(result).toEqual({
        success: false,
        error: "Failed to read file: File not found",
      });
    });
  });

  describe("writeFileTool", () => {
    it("should write file contents", async () => {
      (writeFile as jest.Mock).mockResolvedValue(undefined);

      const result = await writeFileTool.call({
        path: "test.txt",
        content: "test content",
      });

      expect(result).toEqual({
        success: true,
        message: "File written successfully",
      });
      expect(writeFile).toHaveBeenCalledWith("test.txt", "test content");
    });

    it("should handle errors", async () => {
      const error = new Error("Permission denied");
      (writeFile as jest.Mock).mockRejectedValue(error);

      const result = await writeFileTool.call({
        path: "test.txt",
        content: "test content",
      });
      expect(result).toEqual({
        success: false,
        error: "Failed to write file: Permission denied",
      });
    });
  });

  describe("searchFilesTool", () => {
    it("should search for files", async () => {
      const mockFiles = ["file1.txt", "file2.txt"];
      (searchFiles as jest.Mock).mockResolvedValue(mockFiles);

      const result = await searchFilesTool.call({ pattern: "*.txt" });
      expect(result).toEqual({ success: true, files: mockFiles });
      expect(searchFiles).toHaveBeenCalledWith("*.txt");
    });

    it("should handle errors", async () => {
      const error = new Error("Invalid pattern");
      (searchFiles as jest.Mock).mockRejectedValue(error);

      const result = await searchFilesTool.call({ pattern: "*.txt" });
      expect(result).toEqual({
        success: false,
        error: "Failed to search files: Invalid pattern",
      });
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

## Recap

### Completed Implementation

1. **Core File Tools**

   - Implemented readFile, writeFile, and searchFiles tools
   - Added proper error handling with structured responses
   - Integrated with existing FileToolsImpl
   - Fixed recursion limit issues

2. **Testing**
   - Created comprehensive unit tests
   - Added error handling tests
   - Verified tool functionality
   - Tested integration with FileToolsImpl

### Key Decisions

1. **Structured Responses**

   - All tools return { success: boolean, ... } format
   - Consistent error handling across tools
   - Clear success/error indicators

2. **Error Handling**
   - Proper error propagation
   - User-friendly error messages
   - Type-safe error handling

### Next Steps

- Monitor tool usage in production
- Gather feedback on error messages
- Consider additional tool enhancements
- Update documentation as needed
