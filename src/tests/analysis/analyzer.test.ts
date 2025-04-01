import { ProjectAnalyzer } from "../../analysis/analyzer";
import { ChunkManager } from "../../analysis/chunk";
import {
  MockFileTools,
  createSampleAnalysis,
  createSampleChunk,
} from "./test-utils";

describe("ProjectAnalyzer", () => {
  let analyzer: ProjectAnalyzer;
  let chunkManager: ChunkManager;
  let mockFileTools: MockFileTools;

  beforeEach(() => {
    mockFileTools = new MockFileTools({
      "package.json": `=== package.json ===
${JSON.stringify(
  {
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
  },
  null,
  2
)}
=== end package.json ===`,
      "README.md": `=== README.md ===
# Test Project

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
- Test coverage
=== end README.md ===`,
      "src/index.ts": `=== src/index.ts ===
import { FileTools } from "./tools/file";

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

export { ProjectAnalyzer, FileTools };
=== end src/index.ts ===`,
    });

    chunkManager = new ChunkManager(mockFileTools);
    analyzer = new ProjectAnalyzer(chunkManager, mockFileTools);
  });

  describe("analyzeProject", () => {
    it("should analyze the entire project and generate architecture and specification information", async () => {
      const analysis = await analyzer.analyzeProject();

      // Check architecture information
      expect(analysis.architecture.techStack).toContain("typescript");
      expect(analysis.architecture.techStack).toContain("node");
      expect(analysis.architecture.techStack).toContain("jest");
      expect(analysis.architecture.projectStructure).toContain("src/");
      expect(analysis.architecture.patterns).toContain("Object-Oriented");
      expect(analysis.architecture.patterns).toContain("Interface-based");

      // Check specification information
      expect(analysis.specification.goals).toContain("Build a CLI tool");
      expect(analysis.specification.goals).toContain(
        "Support project analysis"
      );
      expect(analysis.specification.components).toContain("ProjectAnalyzer");
      expect(analysis.specification.components).toContain("FileTools");
      expect(analysis.specification.requirements).toContain(
        "TypeScript support"
      );
      expect(analysis.specification.requirements).toContain("Test coverage");
    });

    it("should handle errors gracefully", async () => {
      // Create a mock file tools that throws an error
      const errorFileTools = new MockFileTools({
        "package.json": `=== package.json ===
{invalid json}
=== end package.json ===`,
      });
      const errorChunkManager = new ChunkManager(errorFileTools);
      const errorAnalyzer = new ProjectAnalyzer(
        errorChunkManager,
        errorFileTools
      );

      await expect(errorAnalyzer.analyzeProject()).rejects.toThrow();
    });
  });

  describe("extractArchitectureInfo", () => {
    it("should extract architecture information from a chunk", async () => {
      const chunk = createSampleChunk();
      const info = await (analyzer as any).extractArchitectureInfo(chunk);

      expect(info.techStack).toContain("typescript");
      expect(info.techStack).toContain("node");
      expect(info.projectStructure).toContain("src/");
      expect(info.patterns).toContain("Object-Oriented");
    });
  });

  describe("extractSpecificationInfo", () => {
    it("should extract specification information from a chunk", async () => {
      const chunk = createSampleChunk();
      const info = await (analyzer as any).extractSpecificationInfo(chunk);

      expect(info.goals).toContain("Build a CLI tool");
      expect(info.goals).toContain("Support project analysis");
      expect(info.requirements).toContain("TypeScript support");
      expect(info.requirements).toContain("Test coverage");
    });
  });

  describe("mergeAnalysis", () => {
    it("should merge chunk analysis results correctly", () => {
      const analysis = createSampleAnalysis();
      const chunkAnalysis = {
        chunkId: "test-chunk",
        architecture: {
          techStack: ["new-package"],
          projectStructure: "new/structure",
          patterns: ["New-Pattern"],
        },
        specification: {
          goals: ["New goal"],
          components: ["NewComponent"],
          requirements: ["New requirement"],
        },
      };

      (analyzer as any).mergeAnalysis(analysis, chunkAnalysis);

      expect(analysis.architecture.techStack).toContain("new-package");
      expect(analysis.architecture.projectStructure).toBe("new/structure");
      expect(analysis.architecture.patterns).toContain("New-Pattern");
      expect(analysis.specification.goals).toContain("New goal");
      expect(analysis.specification.components).toContain("NewComponent");
      expect(analysis.specification.requirements).toContain("New requirement");
    });

    it("should handle partial chunk analysis results", () => {
      const analysis = createSampleAnalysis();
      const chunkAnalysis = {
        chunkId: "test-chunk",
        architecture: {
          techStack: ["new-package"],
        },
        specification: {
          goals: ["New goal"],
        },
      };

      (analyzer as any).mergeAnalysis(analysis, chunkAnalysis);

      expect(analysis.architecture.techStack).toContain("new-package");
      expect(analysis.specification.goals).toContain("New goal");
      // Original values should be preserved
      expect(analysis.architecture.projectStructure).toBe(
        "src/\n  analysis/\n  tools/\n  tests/"
      );
      expect(analysis.specification.components).toContain("FileTools");
    });
  });
});
