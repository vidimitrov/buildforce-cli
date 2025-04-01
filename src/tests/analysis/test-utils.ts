import { AnalysisChunk, ProjectAnalysis } from "../../analysis/types";
import { FileTools } from "../../tools/file/types";

/**
 * Creates a mock file tools implementation for testing
 */
export class MockFileTools implements FileTools {
  private files: Map<string, string>;

  constructor(files: Record<string, string>) {
    this.files = new Map(Object.entries(files));
  }

  async readFile(path: string): Promise<string> {
    const content = this.files.get(path);
    if (!content) {
      throw new Error(`File not found: ${path}`);
    }
    return content;
  }

  async searchFiles(pattern: string): Promise<string[]> {
    // Simple glob pattern matching
    const files = Array.from(this.files.keys());

    // Handle * pattern (match all files)
    if (pattern === "*" || pattern === "**/*") {
      return files.sort();
    }

    // Handle specific extensions
    if (pattern.startsWith("*.")) {
      const ext = pattern.slice(1);
      return files.filter((f) => f.endsWith(ext)).sort();
    }

    // Handle directory patterns
    if (pattern.includes("*")) {
      const regexPattern = pattern
        .replace(/\*/g, ".*")
        .replace(/\?/g, ".")
        .replace(/\./g, "\\.");
      const regex = new RegExp(`^${regexPattern}$`);
      return files.filter((f) => regex.test(f)).sort();
    }

    // Handle exact matches
    return files.filter((f) => f === pattern).sort();
  }

  async writeFile(path: string, content: string): Promise<void> {
    this.files.set(path, content);
  }
}

/**
 * Creates a sample project analysis for testing
 */
export function createSampleAnalysis(): ProjectAnalysis {
  return {
    architecture: {
      techStack: ["typescript", "node", "jest"],
      projectStructure: "src/\n  analysis/\n  tools/\n  tests/",
      patterns: ["Object-Oriented", "Interface-based"],
    },
    specification: {
      goals: ["Build a CLI tool", "Support project analysis"],
      components: ["FileTools", "ProjectAnalyzer"],
      requirements: ["TypeScript support", "Test coverage"],
    },
  };
}

/**
 * Creates a sample analysis chunk for testing
 */
export function createSampleChunk(): AnalysisChunk {
  const packageJson = {
    name: "test-project",
    dependencies: {
      typescript: "^4.9.0",
      node: "^16.0.0",
      jest: "^27.0.0",
    },
    devDependencies: {
      "@types/node": "^16.0.0",
      "@types/jest": "^27.0.0",
    },
  };

  const readme = `# Test Project

## Goals

- Build a CLI tool
- Support project analysis

## Project Structure

\`\`\`
src/
  analysis/
  tools/
  tests/
\`\`\`

## Requirements

- TypeScript support
- Test coverage`;

  const indexTs = `import { FileTools } from './tools/file';

/**
 * Main analyzer class for processing project files
 */
class ProjectAnalyzer {
  constructor(private readonly fileTools: FileTools) {}

  async analyze(): Promise<void> {
    // Implementation
  }
}

interface FileTools {
  readFile(path: string): Promise<string>;
  searchFiles(pattern: string): Promise<string[]>;
}

export { ProjectAnalyzer, FileTools };`;

  // Format the content with clear separators
  const content = [
    `=== package.json ===\n${JSON.stringify(
      packageJson,
      null,
      2
    )}\n=== end package.json ===`,
    `=== README.md ===\n${readme}\n=== end README.md ===`,
    `=== src/index.ts ===\n${indexTs}\n=== end src/index.ts ===`,
  ].join("\n\n");

  return {
    id: "test-chunk",
    files: ["package.json", "README.md", "src/index.ts"],
    content,
    dependencies: [],
    relevance: 0.8,
  };
}
