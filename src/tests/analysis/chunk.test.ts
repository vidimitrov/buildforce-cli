import { ChunkManager } from "../../analysis/chunk";
import { MockFileTools, createSampleChunk } from "./test-utils";

describe("ChunkManager", () => {
  let chunkManager: ChunkManager;
  let mockFileTools: MockFileTools;

  beforeEach(() => {
    mockFileTools = new MockFileTools({
      "package.json": JSON.stringify({
        name: "test-project",
        dependencies: {
          typescript: "^4.9.0",
          node: "^16.0.0",
        },
      }),
      "README.md": "# Test Project\n\n## Goals\n\n- Build a CLI tool",
      "src/index.ts":
        'import { FileTools } from "./tools/file";\n\nclass ProjectAnalyzer {}',
    });

    chunkManager = new ChunkManager(mockFileTools);
  });

  describe("createChunk", () => {
    it("should create a chunk from files", async () => {
      const files = ["package.json", "README.md"];
      const chunk = await chunkManager.createChunk(files);

      expect(chunk.id).toBe("package_json_README_md");
      expect(chunk.files).toEqual(files);
      expect(chunk.content).toContain("test-project");
      expect(chunk.content).toContain("Build a CLI tool");
      expect(chunk.dependencies).toEqual([]);
      expect(chunk.relevance).toBeGreaterThan(0);
    });

    it("should handle file read errors", async () => {
      const files = ["nonexistent.json"];
      await expect(chunkManager.createChunk(files)).rejects.toThrow();
    });
  });

  describe("prioritizeChunks", () => {
    it("should prioritize chunks based on relevance and dependencies", async () => {
      const chunks = [
        { ...createSampleChunk(), relevance: 0.8, dependencies: [] },
        {
          ...createSampleChunk(),
          relevance: 0.6,
          dependencies: ["package.json"],
        },
        { ...createSampleChunk(), relevance: 0.9, dependencies: ["README.md"] },
      ];

      const prioritized = await chunkManager.prioritizeChunks(chunks);

      expect(prioritized[0].relevance).toBe(0.9);
      expect(prioritized[1].relevance).toBe(0.8);
      expect(prioritized[2].relevance).toBe(0.6);
    });

    it("should filter out chunks with low relevance", async () => {
      const chunks = [
        { ...createSampleChunk(), relevance: 0.8 },
        { ...createSampleChunk(), relevance: 0.3 },
        { ...createSampleChunk(), relevance: 0.9 },
      ];

      const prioritized = await chunkManager.prioritizeChunks(chunks);

      expect(prioritized.length).toBe(2);
      expect(prioritized.every((chunk) => chunk.relevance >= 0.5)).toBe(true);
    });
  });
});
