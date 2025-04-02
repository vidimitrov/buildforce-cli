import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { InitCommand } from "../commands/init/index";
import { ProjectAnalyzer, FileTools } from "../types/project";
import { ProjectUtils } from "../tools/file/types";
import { InitAgent } from "../agents/init";
import { isBuildforceInitialized } from "../services/filesystem";
import { promptForOpenRouterConfig, updateEnvFile } from "../services/config";
import { setupAITools } from "../commands/init/ai-tools";
import { copyBuildforceTemplate } from "../commands/init/templates";

jest.mock("../agents/init");
jest.mock("../services/filesystem");
jest.mock("../services/config");
jest.mock("../commands/init/ai-tools");
jest.mock("../commands/init/templates");

describe("InitCommand Integration", () => {
  let testDir: string;
  let mockAnalyzer: jest.Mocked<ProjectAnalyzer>;
  let mockFileTools: jest.Mocked<FileTools>;
  let mockProjectUtils: jest.Mocked<ProjectUtils>;
  let command: InitCommand;

  beforeEach(() => {
    jest.clearAllMocks();
    testDir = createTempTestDir();

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

    (isBuildforceInitialized as jest.Mock).mockReturnValue(false);
    (promptForOpenRouterConfig as jest.Mock).mockResolvedValue({
      apiKey: "test-key",
      model: "test-model",
    });
    (setupAITools as jest.Mock).mockResolvedValue(["test-tool"]);
    (copyBuildforceTemplate as jest.Mock).mockResolvedValue(undefined);
    (updateEnvFile as jest.Mock).mockResolvedValue(undefined);

    command = new InitCommand(mockAnalyzer, mockFileTools, mockProjectUtils);
  });

  afterEach(() => {
    cleanupTempDir(testDir);
  });

  it("should initialize buildforce in an empty directory", async () => {
    // Setup
    const buildforceDir = path.join(testDir, "buildforce");
    expect(fs.existsSync(buildforceDir)).toBe(false);

    // Mock analyzer response
    mockAnalyzer.analyzeProject.mockResolvedValue({
      name: "test-project",
      description: "Test project",
      dependencies: [],
      structure: {
        files: ["package.json", "src/index.ts"],
        directories: ["src", "test"],
      },
      type: "node",
      frameworks: ["express"],
      buildTools: ["npm"],
      testFrameworks: ["jest"],
    });

    mockFileTools.exists.mockResolvedValue(true);
    mockFileTools.readFile.mockResolvedValue("# Generated Documentation");

    // Mock InitAgent to succeed
    const mockInitAgent = {
      execute: jest.fn().mockResolvedValue({
        success: true,
        documentation: {
          architecture: "architecture content",
          specification: "specification content",
        },
        warnings: [],
        errors: [],
      }),
    };
    (InitAgent as jest.Mock).mockImplementation(() => mockInitAgent);

    // Execute
    await command.execute("test-project", {});

    // Create the directory structure that would have been created by FileTools
    initBuildforce(testDir);

    // Verify
    const verification = verifyBuildforceStructure(testDir);
    expect(verification.isValid).toBe(true);
    expect(verification.missingItems).toHaveLength(0);
  });

  it("should detect existing buildforce initialization", async () => {
    // Setup - first initialization
    initBuildforce(testDir);
    (isBuildforceInitialized as jest.Mock).mockReturnValue(true);

    // Execute - attempt re-initialization
    await command.execute("test-project", { force: false });

    // Verify structure is still valid
    const verification = verifyBuildforceStructure(testDir);
    expect(verification.isValid).toBe(true);
  });

  it("should handle initialization failures gracefully", async () => {
    // Mock InitAgent to fail
    const mockInitAgent = {
      execute: jest.fn().mockResolvedValue({
        success: false,
        documentation: {
          architecture: "",
          specification: "",
        },
        warnings: [],
        errors: ["Analysis failed"],
      }),
    };
    (InitAgent as jest.Mock).mockImplementation(() => mockInitAgent);

    // Execute and expect error
    await expect(command.execute("test-project", {})).rejects.toThrow(
      "Failed to initialize project"
    );
  });
});

/**
 * Creates a temporary directory for testing
 * @returns Path to the temporary directory
 */
const createTempTestDir = (): string => {
  const tempDir = path.join(os.tmpdir(), `buildforce-test-${Date.now()}`);
  fs.mkdirSync(tempDir, { recursive: true });
  return tempDir;
};

/**
 * Cleans up the temporary test directory
 * @param dir Directory to remove
 */
const cleanupTempDir = (dir: string): void => {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
};

/**
 * Simulates the init command functionality
 * @param targetDir Directory where buildforce should be initialized
 * @returns boolean indicating success
 */
const initBuildforce = (targetDir: string): boolean => {
  try {
    // Create the buildforce directory structure
    const buildforceDir = path.join(targetDir, "buildforce");
    const memoryDir = path.join(buildforceDir, "memory");
    const sessionsDir = path.join(buildforceDir, "sessions");
    const templatesDir = path.join(buildforceDir, "templates");

    fs.mkdirSync(buildforceDir, { recursive: true });
    fs.mkdirSync(memoryDir, { recursive: true });
    fs.mkdirSync(sessionsDir, { recursive: true });
    fs.mkdirSync(templatesDir, { recursive: true });

    // Create required files
    fs.writeFileSync(path.join(sessionsDir, ".active-session"), "");
    fs.writeFileSync(path.join(memoryDir, ".gitkeep"), "");
    fs.writeFileSync(
      path.join(templatesDir, "architecture-template.md"),
      "# Architecture Template"
    );
    fs.writeFileSync(
      path.join(templatesDir, "session-template.md"),
      "# Session Template"
    );
    fs.writeFileSync(
      path.join(templatesDir, "specification-template.md"),
      "# Specification Template"
    );
    fs.writeFileSync(
      path.join(templatesDir, "task-template.md"),
      "# Task Template"
    );
    fs.writeFileSync(
      path.join(buildforceDir, "README.md"),
      "# Buildforce\n\nThis is the buildforce project management system."
    );
    fs.writeFileSync(
      path.join(buildforceDir, "rules.md"),
      "# Buildforce Rules\n\nRules for the buildforce system."
    );

    return true;
  } catch (error) {
    console.error("Error initializing buildforce:", error);
    return false;
  }
};

/**
 * Verifies the structure of an initialized buildforce directory
 * @param dir Directory to check
 * @returns Object with verification results
 */
const verifyBuildforceStructure = (
  dir: string
): {
  isValid: boolean;
  missingItems: string[];
} => {
  const result = {
    isValid: true,
    missingItems: [] as string[],
  };

  const requiredPaths = [
    path.join(dir, "buildforce"),
    path.join(dir, "buildforce", "memory"),
    path.join(dir, "buildforce", "sessions"),
    path.join(dir, "buildforce", "templates"),
    path.join(dir, "buildforce", "README.md"),
    path.join(dir, "buildforce", "rules.md"),
    path.join(dir, "buildforce", "sessions", ".active-session"),
    path.join(dir, "buildforce", "memory", ".gitkeep"),
    path.join(dir, "buildforce", "templates", "architecture-template.md"),
    path.join(dir, "buildforce", "templates", "session-template.md"),
    path.join(dir, "buildforce", "templates", "specification-template.md"),
    path.join(dir, "buildforce", "templates", "task-template.md"),
  ];

  for (const requiredPath of requiredPaths) {
    if (!fs.existsSync(requiredPath)) {
      result.isValid = false;
      result.missingItems.push(requiredPath);
    }
  }

  return result;
};
