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
