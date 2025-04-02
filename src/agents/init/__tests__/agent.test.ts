import { InitAgent } from "../agent";
import { ProjectAnalyzer, FileTools } from "../../../types/project";
import { ProjectUtils } from "../../../tools/file/types";
import { InitAgentConfig } from "../types";
import { ChatOpenAI } from "@langchain/openai";
import { AIMessageChunk } from "@langchain/core/messages";

describe("InitAgent", () => {
  let agent: InitAgent;
  let mockConfig: InitAgentConfig;
  let mockAnalyzer: jest.Mocked<ProjectAnalyzer>;
  let mockFileTools: jest.Mocked<FileTools>;
  let mockProjectUtils: jest.Mocked<ProjectUtils>;
  let mockModel: jest.Mocked<ChatOpenAI>;

  beforeEach(() => {
    mockConfig = {
      projectName: "test-project",
      rootDir: "/test/project",
      options: {},
    };

    mockAnalyzer = {
      analyzeProject: jest.fn(),
    } as any;

    mockFileTools = {
      readFile: jest.fn(),
      writeFile: jest.fn(),
      exists: jest.fn(),
      mkdir: jest.fn(),
    } as any;

    mockProjectUtils = {
      listDirectory: jest.fn(),
    } as any;

    mockModel = {
      invoke: jest.fn(),
    } as any;

    agent = new InitAgent(
      mockConfig,
      mockAnalyzer,
      mockFileTools,
      mockProjectUtils,
      mockModel
    );
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
    mockModel.invoke.mockResolvedValue(new AIMessageChunk("generated content"));

    const result = await agent.execute();

    expect(result.success).toBe(true);
    expect(result.warnings).toHaveLength(0);
    expect(result.errors).toHaveLength(0);
    expect(mockAnalyzer.analyzeProject).toHaveBeenCalledWith(
      mockConfig.rootDir
    );
    expect(mockFileTools.writeFile).toHaveBeenCalledTimes(2);
  });

  it("should handle analysis failures", async () => {
    mockAnalyzer.analyzeProject.mockRejectedValue(new Error("Analysis failed"));

    const result = await agent.execute();

    expect(result.success).toBe(false);
    expect(result.errors).toContain(
      "Failed to analyze project: Analysis failed"
    );
  });

  it("should skip analysis when configured", async () => {
    const configWithSkip = {
      ...mockConfig,
      options: { skipAnalysis: true },
    };

    agent = new InitAgent(
      configWithSkip,
      mockAnalyzer,
      mockFileTools,
      mockProjectUtils,
      mockModel
    );

    mockFileTools.exists.mockResolvedValue(true);
    mockFileTools.readFile.mockResolvedValue("content");
    mockModel.invoke.mockResolvedValue(new AIMessageChunk("generated content"));

    const result = await agent.execute();

    expect(result.success).toBe(true);
    expect(mockAnalyzer.analyzeProject).not.toHaveBeenCalled();
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
