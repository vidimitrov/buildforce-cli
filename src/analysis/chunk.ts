import {
  AnalysisChunk,
  AnalysisConfig,
  AnalysisError,
  AnalysisSystemError,
} from "./types";
import { FileTools } from "../tools/file/types";

/**
 * Manages the creation and prioritization of analysis chunks
 */
export class ChunkManager {
  private readonly config: AnalysisConfig;

  constructor(
    private readonly fileTools: FileTools,
    config?: Partial<AnalysisConfig>
  ) {
    this.config = {
      maxChunkSize: config?.maxChunkSize ?? 10000,
      minRelevance: config?.minRelevance ?? 0.5,
      maxDependencies: config?.maxDependencies ?? 5,
    };
  }

  /**
   * Creates a new analysis chunk from a list of files
   */
  async createChunk(files: string[]): Promise<AnalysisChunk> {
    try {
      const content = await this.readFiles(files);
      const dependencies = await this.findDependencies({
        id: "",
        files,
        content,
        dependencies: [],
        relevance: 0,
      });
      const relevance = await this.calculateRelevance({
        id: "",
        files,
        content,
        dependencies,
        relevance: 0,
      });

      return {
        id: this.generateId(files),
        files,
        content,
        dependencies: dependencies.slice(0, this.config.maxDependencies),
        relevance,
      };
    } catch (error) {
      throw new AnalysisSystemError(
        AnalysisError.CHUNK_CREATION_ERROR,
        "Failed to create analysis chunk",
        error
      );
    }
  }

  /**
   * Prioritizes chunks based on relevance and dependencies
   */
  async prioritizeChunks(chunks: AnalysisChunk[]): Promise<AnalysisChunk[]> {
    return chunks
      .filter((chunk) => chunk.relevance >= this.config.minRelevance)
      .sort((a, b) => {
        // First sort by relevance
        const relevanceDiff = b.relevance - a.relevance;
        if (relevanceDiff !== 0) return relevanceDiff;

        // Then by number of dependencies (fewer dependencies first)
        return a.dependencies.length - b.dependencies.length;
      });
  }

  /**
   * Calculates the relevance of a chunk based on its content and file types
   */
  private async calculateRelevance(chunk: AnalysisChunk): Promise<number> {
    const fileTypes = chunk.files.map((file) => {
      const filename = file.toLowerCase();
      if (filename === "package.json") return "package.json";
      if (filename === "tsconfig.json") return "tsconfig.json";
      if (filename === "readme.md") return "readme.md";
      const ext = this.getFileType(file);
      return ext ? `.${ext}` : "";
    });

    // Calculate base relevance from file types
    const typeRelevance =
      fileTypes.reduce((acc, type) => {
        switch (type) {
          case "package.json":
          case "tsconfig.json":
          case "readme.md":
            return acc + 1;
          case ".ts":
          case ".js":
            return acc + 0.8;
          case ".md":
            return acc + 0.6;
          default:
            return acc + 0.2;
        }
      }, 0) / Math.max(fileTypes.length, 1); // Avoid division by zero

    // Normalize content length relevance
    const contentRelevance = Math.min(
      chunk.content.length / this.config.maxChunkSize,
      1
    );

    // Combine both factors with higher weight on type relevance
    return typeRelevance * 0.7 + contentRelevance * 0.3;
  }

  /**
   * Finds dependencies between chunks based on imports and references
   */
  private async findDependencies(chunk: AnalysisChunk): Promise<string[]> {
    const dependencies: string[] = [];

    // Look for import statements
    const importRegex = /import\s+.*?from\s+['"]([^'"]+)['"]/g;
    let match;
    while ((match = importRegex.exec(chunk.content)) !== null) {
      const importPath = match[1];
      if (importPath.startsWith("./") || importPath.startsWith("../")) {
        dependencies.push(importPath);
      }
    }

    // Look for require statements
    const requireRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    while ((match = requireRegex.exec(chunk.content)) !== null) {
      const requirePath = match[1];
      if (requirePath.startsWith("./") || requirePath.startsWith("../")) {
        dependencies.push(requirePath);
      }
    }

    return dependencies;
  }

  /**
   * Reads the content of multiple files
   */
  private async readFiles(files: string[]): Promise<string> {
    try {
      const contents = await Promise.all(
        files.map(async (file) => {
          const content = await this.fileTools.readFile(file);
          // Check if the content already has markers
          if (
            content.startsWith(`=== ${file} ===\n`) &&
            content.endsWith(`\n=== end ${file} ===`)
          ) {
            return content;
          }
          // Add a clear separator between files
          return `=== ${file} ===\n${content}\n=== end ${file} ===`;
        })
      );
      return contents.join("\n\n");
    } catch (error) {
      throw new AnalysisSystemError(
        AnalysisError.FILE_READ_ERROR,
        "Failed to read files for chunk creation",
        error
      );
    }
  }

  /**
   * Generates a unique ID for a chunk based on its files
   */
  private generateId(files: string[]): string {
    return files.map((file) => file.replace(/[^a-zA-Z0-9]/g, "_")).join("_");
  }

  /**
   * Gets the file type from a file path
   */
  private getFileType(file: string): string {
    const parts = file.split(".");
    return parts.length > 1 ? parts[parts.length - 1] : "";
  }
}
