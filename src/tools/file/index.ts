import { promises as fs } from "fs";
import { join } from "path";
import { globSync } from "glob";
import { FileTools, ProjectUtils } from "./types";
import {
  FileOperationError,
  FileNotFoundError,
  DirectoryNotFoundError,
  FileWriteError,
  FileReadError,
} from "./errors";

export class FileToolsImpl implements FileTools {
  constructor(private readonly rootDir: string) {}

  async readFile(path: string): Promise<string> {
    try {
      const fullPath = this.resolvePath(path);
      return await fs.readFile(fullPath, "utf-8");
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        throw new FileNotFoundError(path);
      }
      throw new FileReadError(path, error);
    }
  }

  async searchFiles(pattern: string): Promise<string[]> {
    try {
      const fullPattern = this.resolvePath(pattern);
      return globSync(fullPattern, {
        ignore: ["node_modules/**", "dist/**"],
        nodir: false,
        absolute: true,
      });
    } catch (error) {
      throw new FileOperationError(`Failed to search files: ${pattern}`, error);
    }
  }

  async writeFile(path: string, content: string): Promise<void> {
    try {
      const fullPath = this.resolvePath(path);
      await fs.writeFile(fullPath, content, "utf-8");
    } catch (error) {
      throw new FileWriteError(path, error);
    }
  }

  async exists(path: string): Promise<boolean> {
    try {
      const fullPath = this.resolvePath(path);
      const stats = await fs.stat(fullPath);
      return stats.isFile();
    } catch (error) {
      return false;
    }
  }

  async mkdir(path: string): Promise<void> {
    try {
      const fullPath = this.resolvePath(path);
      await fs.mkdir(fullPath, { recursive: true });
    } catch (error) {
      throw new FileOperationError(
        `Failed to create directory: ${path}`,
        error
      );
    }
  }

  private resolvePath(path: string): string {
    return path.startsWith("/") ? path : join(this.rootDir, path);
  }
}

export class ProjectUtilsImpl implements ProjectUtils {
  constructor(private readonly rootDir: string) {}

  getProjectRoot(): string {
    return this.rootDir;
  }

  async listDirectory(path: string): Promise<string[]> {
    try {
      const fullPath = this.resolvePath(path);
      const files = await fs.readdir(fullPath, { withFileTypes: true });
      const filePaths: string[] = [];

      for (const file of files) {
        const fullFilePath = join(fullPath, file.name);

        if (file.isDirectory()) {
          // Skip node_modules and other special directories
          if (file.name === "node_modules" || file.name === ".git") {
            continue;
          }
          // Recursively get files from subdirectories
          const subFiles = await this.listDirectory(fullFilePath);
          filePaths.push(...subFiles);
        } else {
          filePaths.push(fullFilePath);
        }
      }

      return filePaths;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        throw new DirectoryNotFoundError(path);
      }
      throw new FileOperationError(`Failed to list directory: ${path}`, error);
    }
  }

  async getRelevantFiles(pattern: string): Promise<string[]> {
    try {
      const fullPattern = this.resolvePath(pattern);
      return globSync(fullPattern, { ignore: ["node_modules/**"] });
    } catch (error) {
      throw new FileOperationError(
        `Failed to get relevant files: ${pattern}`,
        error
      );
    }
  }

  private resolvePath(path: string): string {
    return path.startsWith("/") ? path : join(this.rootDir, path);
  }
}

// Export factory functions for convenience
export function createFileTools(rootDir: string): FileTools {
  return new FileToolsImpl(rootDir);
}

export function createProjectUtils(rootDir: string): ProjectUtils {
  return new ProjectUtilsImpl(rootDir);
}
