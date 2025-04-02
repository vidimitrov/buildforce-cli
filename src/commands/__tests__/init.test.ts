import { InitCommand } from "../init/index";
import { ProjectAnalyzer } from "../../analysis/analyzer";
import { FileTools } from "../../types/project";
import { InitAgent } from "../../agents/init";
import { isBuildforceInitialized } from "../../services/filesystem";
import { Command } from "commander";
import {
  promptForOpenRouterConfig,
  updateEnvFile,
} from "../../services/config";
import { setupAITools } from "../init/ai-tools";
import { copyBuildforceTemplate } from "../init/templates";

jest.mock("../../analysis/analyzer");
jest.mock("../../types/project");
jest.mock("../../agents/init");
jest.mock("../../services/filesystem");
jest.mock("../../services/config");
jest.mock("../init/ai-tools");
jest.mock("../init/templates");

describe("InitCommand", () => {
  let initCommand: InitCommand;
  let mockAnalyzer: jest.Mocked<ProjectAnalyzer>;
  let mockFileTools: jest.Mocked<FileTools>;
  let mockInitAgent: jest.Mocked<InitAgent>;
  let mockExecute: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAnalyzer = {
      analyzeProject: jest.fn(),
    } as unknown as jest.Mocked<ProjectAnalyzer>;
    mockFileTools = {
      readFile: jest.fn(),
      writeFile: jest.fn(),
      exists: jest.fn(),
      mkdir: jest.fn(),
      searchFiles: jest.fn(),
    } as unknown as jest.Mocked<FileTools>;
    mockExecute = jest.fn();
    mockInitAgent = {
      execute: mockExecute,
    } as unknown as jest.Mocked<InitAgent>;
    (InitAgent as jest.Mock).mockImplementation(() => mockInitAgent);
    (isBuildforceInitialized as jest.Mock).mockReturnValue(false);
    (promptForOpenRouterConfig as jest.Mock).mockResolvedValue({
      apiKey: "test-key",
      model: "test-model",
    });
    (setupAITools as jest.Mock).mockResolvedValue(["test-tool"]);
    (copyBuildforceTemplate as jest.Mock).mockResolvedValue(undefined);
    (updateEnvFile as jest.Mock).mockResolvedValue(undefined);
    initCommand = new InitCommand(mockAnalyzer, mockFileTools);
  });

  describe("register", () => {
    it("should register the init command", () => {
      const program = new Command();
      initCommand.register(program);

      const cmd = program.commands.find((c) => c.name() === "init");
      expect(cmd).toBeDefined();
      expect(cmd?.description()).toBe("Initialize project documentation");
    });
  });

  describe("execute", () => {
    it("should handle successful execution", async () => {
      const mockResult = {
        success: true,
        documentation: {
          architecture: "architecture content",
          specification: "specification content",
        },
        warnings: [],
        errors: [],
      };

      mockExecute.mockResolvedValue(mockResult);

      await initCommand.execute("test-project", {});

      expect(mockExecute).toHaveBeenCalled();
    }, 10000);

    it("should handle execution failure", async () => {
      mockExecute.mockResolvedValue({
        success: false,
        documentation: {
          architecture: "",
          specification: "",
        },
        warnings: [],
        errors: ["Analysis failed"],
      });

      await expect(initCommand.execute("test-project", {})).rejects.toThrow(
        "Failed to initialize project"
      );
    }, 10000);

    it("should skip initialization if already done", async () => {
      (isBuildforceInitialized as jest.Mock).mockReturnValue(true);

      await initCommand.execute("test-project", {});

      expect(mockExecute).not.toHaveBeenCalled();
    }, 10000);

    it("should use current directory name when no project name provided", async () => {
      const mockResult = {
        success: true,
        documentation: {
          architecture: "architecture content",
          specification: "specification content",
        },
        warnings: [],
        errors: [],
      };

      mockExecute.mockResolvedValue(mockResult);

      await initCommand.execute("", {});

      expect(mockExecute).toHaveBeenCalled();
    }, 10000);
  });
});
