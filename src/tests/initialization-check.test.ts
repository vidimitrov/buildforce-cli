import * as fs from "fs";
import * as path from "path";
import * as os from "os";

describe("Initialization Check", () => {
  let testDir: string;

  beforeEach(() => {
    testDir = createTempTestDir();
  });

  afterEach(() => {
    cleanupTempDir(testDir);
  });

  it("should detect uninitialized buildforce project", () => {
    expect(isBuildforceInitialized(testDir)).toBe(false);
  });

  it("should detect initialized buildforce project", () => {
    // Create buildforce directory
    const buildforceDir = path.join(testDir, "buildforce");
    fs.mkdirSync(buildforceDir, { recursive: true });

    expect(isBuildforceInitialized(testDir)).toBe(true);
  });

  it("should handle non-existent directories", () => {
    const nonExistentDir = path.join(testDir, "non-existent");
    expect(isBuildforceInitialized(nonExistentDir)).toBe(false);
  });

  it("should handle permission errors", () => {
    // Create directory with no read permissions
    const restrictedDir = path.join(testDir, "restricted");
    fs.mkdirSync(restrictedDir, { recursive: true });
    fs.chmodSync(restrictedDir, 0o000);

    expect(isBuildforceInitialized(restrictedDir)).toBe(false);

    // Restore permissions for cleanup
    fs.chmodSync(restrictedDir, 0o777);
  });
});

// Helper functions
const createTempTestDir = (): string => {
  const tempDir = path.join(os.tmpdir(), `buildforce-test-${Date.now()}`);
  fs.mkdirSync(tempDir, { recursive: true });
  return tempDir;
};

const cleanupTempDir = (dir: string): void => {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
};

const isBuildforceInitialized = (dir: string): boolean => {
  try {
    const buildforceDir = path.join(dir, "buildforce");
    return fs.existsSync(buildforceDir);
  } catch (error) {
    return false;
  }
};
