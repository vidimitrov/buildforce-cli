import { Command } from "commander";
import { InitCommand } from "../init";
import { ProjectAnalyzer, FileTools } from "../../types/project";

describe("InitCommand", () => {
  let command: InitCommand;
  let mockAnalyzer: jest.Mocked<ProjectAnalyzer>;
  let mockFileTools: jest.Mocked<FileTools>;
  let program: Command;

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

    command = new InitCommand(mockAnalyzer, mockFileTools);
    program = new Command();
  });

  it("should register the init command", () => {
    command.register(program);
    const initCommand = program.commands.find((cmd) => cmd.name() === "init");
    expect(initCommand).toBeDefined();
    expect(initCommand?.description()).toBe("Initialize project documentation");
  });

  it("should handle successful execution", async () => {
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
    mockFileTools.exists.mockResolvedValue(true);
    mockFileTools.readFile.mockResolvedValue("content");

    await command.execute("test-project", { verbose: true });

    expect(mockAnalyzer.analyzeProject).toHaveBeenCalledWith(process.cwd());
  });

  it("should handle execution failure", async () => {
    mockAnalyzer.analyzeProject.mockRejectedValue(new Error("Analysis failed"));

    await expect(command.execute("test-project", {})).rejects.toThrow();
  });

  it("should use current directory name when project name is not provided", async () => {
    const currentDir = process.cwd().split("/").pop() || "unknown";

    mockAnalyzer.analyzeProject.mockResolvedValue({
      name: currentDir,
      description: "",
      dependencies: [],
      structure: { files: [], directories: [] },
      type: "node",
      frameworks: [],
      buildTools: [],
      testFrameworks: [],
    });

    mockFileTools.exists.mockResolvedValue(true);
    mockFileTools.readFile.mockResolvedValue("content");

    await command.execute("", {});

    expect(mockAnalyzer.analyzeProject).toHaveBeenCalledWith(process.cwd());
  });
});
