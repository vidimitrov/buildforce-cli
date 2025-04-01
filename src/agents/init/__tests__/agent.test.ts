import { InitAgent } from "../agent";
import { ProjectAnalyzer, FileTools } from "../../../types/project";

describe("InitAgent", () => {
  let agent: InitAgent;
  let mockAnalyzer: jest.Mocked<ProjectAnalyzer>;
  let mockFileTools: jest.Mocked<FileTools>;

  const mockConfig = {
    projectName: "test-project",
    rootDir: "/test/dir",
    options: {
      skipAnalysis: false,
      force: false,
      verbose: false,
    },
  };

  beforeEach(() => {
    mockAnalyzer = {
      analyzeProject: jest.fn(),
    } as any;

    mockFileTools = {
      readFile: jest.fn(),
      writeFile: jest.fn(),
      exists: jest.fn(),
      mkdir: jest.fn(),
    } as any;

    agent = new InitAgent(mockConfig, {
      analyzer: mockAnalyzer,
      fileTools: mockFileTools,
    });
  });

  it("should analyze project and generate documentation", async () => {
    const mockAnalysis = {
      name: "test-project",
      description: "test description",
      dependencies: ["dep1", "dep2"],
      structure: {
        files: ["file1.ts", "file2.ts"],
        directories: ["src", "test"],
      },
      type: "node" as const,
      frameworks: ["express"],
      buildTools: ["npm"],
      testFrameworks: ["jest"],
    };

    mockAnalyzer.analyzeProject.mockResolvedValue(mockAnalysis);
    mockFileTools.exists.mockResolvedValue(true);
    mockFileTools.readFile.mockResolvedValue("content");

    const result = await agent.execute();

    expect(result.success).toBe(true);
    expect(result.warnings).toHaveLength(0);
    expect(result.errors).toHaveLength(0);
    expect(mockAnalyzer.analyzeProject).toHaveBeenCalledWith(
      mockConfig.rootDir
    );
    expect(mockFileTools.writeFile).toHaveBeenCalledTimes(2);
  });

  it("should skip analysis when configured", async () => {
    const configWithSkip = {
      ...mockConfig,
      options: { ...mockConfig.options, skipAnalysis: true },
    };

    agent = new InitAgent(configWithSkip, {
      analyzer: mockAnalyzer,
      fileTools: mockFileTools,
    });

    mockFileTools.exists.mockResolvedValue(true);
    mockFileTools.readFile.mockResolvedValue("content");

    const result = await agent.execute();

    expect(result.success).toBe(true);
    expect(result.warnings).toContain(
      "Project analysis skipped as per configuration"
    );
    expect(mockAnalyzer.analyzeProject).not.toHaveBeenCalled();
  });

  it("should handle analysis failure", async () => {
    mockAnalyzer.analyzeProject.mockRejectedValue(new Error("Analysis failed"));

    const result = await agent.execute();

    expect(result.success).toBe(false);
    expect(result.errors).toContain("Analysis failed");
  });

  it("should handle file operation failures", async () => {
    const mockAnalysis = {
      name: "test-project",
      description: "test description",
      dependencies: [],
      structure: { files: [], directories: [] },
      type: "node" as const,
      frameworks: [],
      buildTools: [],
      testFrameworks: [],
    };

    mockAnalyzer.analyzeProject.mockResolvedValue(mockAnalysis);
    mockFileTools.exists.mockResolvedValue(false);

    const result = await agent.execute();

    expect(result.success).toBe(false);
    expect(result.errors).toContain(
      "Documentation files were not generated successfully"
    );
  });
});
