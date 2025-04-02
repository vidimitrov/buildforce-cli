import { ProjectAnalyzer } from "../../analysis/analyzer";
import { ChunkManager } from "../../analysis/chunk";
import { FileTools } from "../../types/project";

describe("ProjectAnalyzer", () => {
  let analyzer: ProjectAnalyzer;
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
    analyzer = new ProjectAnalyzer(chunkManager, mockFileTools);
  });

  it("should analyze project structure", async () => {
    const rootDir = "/test/project";
    const mockFiles = ["package.json", "src/index.ts"];
    const mockPackageJson = {
      dependencies: {
        typescript: "^4.9.0",
        node: "^16.0.0",
        jest: "^27.0.0",
      },
    };

    mockFileTools.searchFiles.mockResolvedValue(mockFiles);
    mockFileTools.readFile.mockImplementation(async (path) => {
      if (path === "package.json") {
        return JSON.stringify(mockPackageJson);
      }
      return "";
    });

    const analysis = await analyzer.analyzeProject(rootDir);

    expect(analysis.name).toBe("project");
    expect(analysis.dependencies).toContain("typescript");
    expect(analysis.dependencies).toContain("node");
    expect(analysis.dependencies).toContain("jest");
    expect(analysis.type).toBe("node");
    expect(analysis.structure.files).toEqual(mockFiles);
  });

  it("should handle analysis errors", async () => {
    const rootDir = "/test/project";
    const errorFileTools = {
      ...mockFileTools,
      searchFiles: jest.fn().mockRejectedValue(new Error("File system error")),
    };

    const errorChunkManager = new ChunkManager(errorFileTools);
    const errorAnalyzer = new ProjectAnalyzer(
      errorChunkManager,
      errorFileTools
    );

    await expect(errorAnalyzer.analyzeProject(rootDir)).rejects.toThrow(
      "File system error"
    );
  });
});
