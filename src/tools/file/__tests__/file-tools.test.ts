import { promises as fs } from "fs";
import { join } from "path";
import { createFileTools, createProjectUtils } from "../index";
import {
  FileNotFoundError,
  DirectoryNotFoundError,
  FileWriteError,
} from "../errors";

describe("FileTools", () => {
  const testDir = join(__dirname, "test-files");
  let fileTools: ReturnType<typeof createFileTools>;

  beforeAll(async () => {
    // Create test directory
    await fs.mkdir(testDir, { recursive: true });
    fileTools = createFileTools(testDir);
  });

  afterAll(async () => {
    // Clean up test directory
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe("readFile", () => {
    it("should read file contents", async () => {
      const testContent = "test content";
      const testFile = join(testDir, "test.txt");
      await fs.writeFile(testFile, testContent);

      const content = await fileTools.readFile("test.txt");
      expect(content).toBe(testContent);
    });

    it("should throw FileNotFoundError for non-existent file", async () => {
      await expect(fileTools.readFile("non-existent.txt")).rejects.toThrow(
        FileNotFoundError
      );
    });
  });

  describe("writeFile", () => {
    it("should write file contents", async () => {
      const testContent = "test content";
      const testFile = join(testDir, "write-test.txt");

      await fileTools.writeFile("write-test.txt", testContent);
      const content = await fs.readFile(testFile, "utf-8");
      expect(content).toBe(testContent);
    });

    it("should throw FileWriteError when directory does not exist", async () => {
      await expect(
        fileTools.writeFile("non-existent-dir/test.txt", "content")
      ).rejects.toThrow(FileWriteError);
    });
  });

  describe("searchFiles", () => {
    it("should find files matching pattern", async () => {
      // Clean up test directory first
      await fs.rm(testDir, { recursive: true, force: true });
      await fs.mkdir(testDir, { recursive: true });

      // Create test files
      await fs.writeFile(join(testDir, "test1.txt"), "");
      await fs.writeFile(join(testDir, "test2.txt"), "");
      await fs.writeFile(join(testDir, "other.txt"), "");

      const files = await fileTools.searchFiles("test*.txt");
      expect(files).toContain(join(testDir, "test1.txt"));
      expect(files).toContain(join(testDir, "test2.txt"));
      expect(files).not.toContain(join(testDir, "other.txt"));
    });
  });
});

describe("ProjectUtils", () => {
  const testDir = join(__dirname, "test-project");
  let projectUtils: ReturnType<typeof createProjectUtils>;

  beforeAll(async () => {
    // Create test directory structure
    await fs.mkdir(testDir, { recursive: true });
    await fs.mkdir(join(testDir, "src"), { recursive: true });
    await fs.mkdir(join(testDir, "node_modules"), { recursive: true });
    projectUtils = createProjectUtils(testDir);
  });

  afterAll(async () => {
    // Clean up test directory
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe("getProjectRoot", () => {
    it("should return project root directory", () => {
      expect(projectUtils.getProjectRoot()).toBe(testDir);
    });
  });

  describe("listDirectory", () => {
    it("should list directory contents", async () => {
      const contents = await projectUtils.listDirectory("src");
      expect(Array.isArray(contents)).toBe(true);
    });

    it("should throw DirectoryNotFoundError for non-existent directory", async () => {
      await expect(projectUtils.listDirectory("non-existent")).rejects.toThrow(
        DirectoryNotFoundError
      );
    });
  });

  describe("getRelevantFiles", () => {
    it("should find files matching pattern excluding node_modules", async () => {
      // Create test files
      await fs.writeFile(join(testDir, "src", "test1.ts"), "");
      await fs.writeFile(join(testDir, "src", "test2.ts"), "");
      await fs.writeFile(join(testDir, "node_modules", "test3.ts"), "");

      const files = await projectUtils.getRelevantFiles("src/*.ts");
      expect(files).toHaveLength(2);
      expect(files).toContain(join(testDir, "src", "test1.ts"));
      expect(files).toContain(join(testDir, "src", "test2.ts"));
    });
  });
});
