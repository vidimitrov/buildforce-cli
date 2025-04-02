import { ChunkManager } from "../../analysis/chunk";
import { FileTools } from "../../types/project";
import { AnalysisChunk } from "../../analysis/types";
import { AnalysisSystemError, AnalysisError } from "../../analysis/types";

describe("ChunkManager", () => {
  let chunkManager: ChunkManager;
  let mockFileTools: jest.Mocked<FileTools>;

  beforeEach(() => {
    mockFileTools = {
      readFile: jest.fn(),
      writeFile: jest.fn(),
      exists: jest.fn(),
      mkdir: jest.fn(),
      searchFiles: jest.fn(),
    };

    chunkManager = new ChunkManager(mockFileTools);
  });

  it("should create a chunk from files", async () => {
    const files = ["test.ts", "test2.ts"];
    const content = `=== test.ts ===
const test = 'hello';
=== end test.ts ===

=== test2.ts ===
const test2 = 'world';
=== end test2.ts ===`;

    mockFileTools.readFile.mockImplementation(async (path) => {
      if (path === "test.ts") return "const test = 'hello';";
      if (path === "test2.ts") return "const test2 = 'world';";
      return "";
    });

    const chunk = await chunkManager.createChunk(files);

    expect(chunk.id).toBe("test_ts_test2_ts");
    expect(chunk.files).toEqual(files);
    expect(chunk.content).toBe(content);
    expect(chunk.dependencies).toBeDefined();
    expect(chunk.relevance).toBeGreaterThan(0);
  });

  it("should handle file read errors", async () => {
    const files = ["nonexistent.ts"];

    mockFileTools.readFile.mockRejectedValue(new Error("File not found"));

    await expect(chunkManager.createChunk(files)).rejects.toThrow(
      new AnalysisSystemError(
        AnalysisError.CHUNK_CREATION_ERROR,
        "Failed to create analysis chunk"
      )
    );
  });

  it("should prioritize chunks based on relevance", async () => {
    const chunks: AnalysisChunk[] = [
      {
        id: "chunk1",
        files: ["file1.ts"],
        content: "content1",
        dependencies: [],
        relevance: 0.8,
      },
      {
        id: "chunk2",
        files: ["file2.ts"],
        content: "content2",
        dependencies: [],
        relevance: 0.6,
      },
      {
        id: "chunk3",
        files: ["file3.ts"],
        content: "content3",
        dependencies: [],
        relevance: 0.9,
      },
    ];

    const prioritized = await chunkManager.prioritizeChunks(chunks);

    expect(prioritized[0].relevance).toBe(0.9);
    expect(prioritized[1].relevance).toBe(0.8);
    expect(prioritized[2].relevance).toBe(0.6);
  });

  it("should filter out chunks with low relevance", async () => {
    const chunks: AnalysisChunk[] = [
      {
        id: "chunk1",
        files: ["file1.ts"],
        content: "content1",
        dependencies: [],
        relevance: 0.8,
      },
      {
        id: "chunk2",
        files: ["file2.ts"],
        content: "content2",
        dependencies: [],
        relevance: 0.3,
      },
      {
        id: "chunk3",
        files: ["file3.ts"],
        content: "content3",
        dependencies: [],
        relevance: 0.9,
      },
    ];

    const prioritized = await chunkManager.prioritizeChunks(chunks);

    expect(prioritized.length).toBe(2);
    expect(prioritized.every((chunk) => chunk.relevance >= 0.5)).toBe(true);
  });
});
