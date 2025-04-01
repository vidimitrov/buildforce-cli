import * as fs from "fs";
import * as path from "path";
import * as os from "os";

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
 * Sets up a test buildforce environment
 * @param targetDir Directory where buildforce should be set up
 * @returns boolean indicating success
 */
const setupTestEnvironment = (targetDir: string): boolean => {
  try {
    // Create the buildforce directory structure
    const buildforceDir = path.join(targetDir, "buildforce");
    const memoryDir = path.join(buildforceDir, "memory");
    const sessionsDir = path.join(buildforceDir, "sessions");
    const plannedDir = path.join(sessionsDir, "planned");
    const completedDir = path.join(sessionsDir, "completed");

    fs.mkdirSync(buildforceDir, { recursive: true });
    fs.mkdirSync(memoryDir, { recursive: true });
    fs.mkdirSync(sessionsDir, { recursive: true });
    fs.mkdirSync(plannedDir, { recursive: true });
    fs.mkdirSync(completedDir, { recursive: true });

    // Create test memory files
    fs.writeFileSync(
      path.join(memoryDir, "architecture.md"),
      "# Test Architecture"
    );
    fs.writeFileSync(
      path.join(memoryDir, "specification.md"),
      "# Test Specification"
    );

    // Create test session
    const testSessionDir = path.join(plannedDir, "session-001");
    fs.mkdirSync(testSessionDir, { recursive: true });
    fs.writeFileSync(path.join(testSessionDir, ".chat-history.md"), "");

    // Create active session file
    fs.writeFileSync(
      path.join(sessionsDir, ".active-session"),
      "planned/session-001"
    );

    return true;
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error setting up test environment: ${error.message}`);
    } else {
      console.error("Unknown error occurred during setup");
    }
    return false;
  }
};

/**
 * Simulates the plan command functionality
 * @param targetDir Directory where buildforce is initialized
 * @returns Object with test results
 */
const simulatePlanCommand = (
  targetDir: string
): { success: boolean; sessionNumber: string; chatHistory: string } => {
  try {
    // Get next session number
    const sessionsDir = path.join(targetDir, "buildforce", "sessions");
    const completedDir = path.join(sessionsDir, "completed");
    const plannedDir = path.join(sessionsDir, "planned");

    let maxNumber = 0;
    [completedDir, plannedDir].forEach((dir) => {
      if (fs.existsSync(dir)) {
        fs.readdirSync(dir).forEach((entry) => {
          const match = entry.match(/^session-(\d{3})/);
          if (match) {
            const num = parseInt(match[1]);
            maxNumber = Math.max(maxNumber, num);
          }
        });
      }
    });

    const nextNumber = String(maxNumber + 1).padStart(3, "0");
    const sessionName = `session-${nextNumber}`;

    // Create new session
    const newSessionPath = path.join(plannedDir, sessionName);
    fs.mkdirSync(newSessionPath, { recursive: true });

    // Create chat history
    const chatHistoryPath = path.join(newSessionPath, ".chat-history.md");
    const initialMessage = "Hey! What would you like to work on next?";
    fs.writeFileSync(
      chatHistoryPath,
      `\n## ${new Date().toISOString()} | Assistant\n\n${initialMessage}\n`
    );

    // Update active session
    fs.writeFileSync(
      path.join(sessionsDir, ".active-session"),
      `planned/${sessionName}\n`
    );

    return {
      success: true,
      sessionNumber: nextNumber,
      chatHistory: fs.readFileSync(chatHistoryPath, "utf8"),
    };
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error simulating plan command: ${error.message}`);
    } else {
      console.error("Unknown error occurred during simulation");
    }
    return {
      success: false,
      sessionNumber: "",
      chatHistory: "",
    };
  }
};

/**
 * Verifies the plan command results
 * @param targetDir Directory to check
 * @param sessionNumber Expected session number
 * @returns Object with verification results
 */
const verifyPlanResults = (
  targetDir: string,
  sessionNumber: string
): {
  isValid: boolean;
  activeSession: string;
  hasHistory: boolean;
  errors: string[];
} => {
  const result = {
    isValid: true,
    activeSession: "",
    hasHistory: false,
    errors: [] as string[],
  };

  try {
    // Check active session
    const activeSessionPath = path.join(
      targetDir,
      "buildforce",
      "sessions",
      ".active-session"
    );
    if (fs.existsSync(activeSessionPath)) {
      result.activeSession = fs.readFileSync(activeSessionPath, "utf8").trim();
      const expectedSession = `planned/session-${sessionNumber}`;
      if (result.activeSession !== expectedSession) {
        result.isValid = false;
        result.errors.push(
          `Active session mismatch: expected ${expectedSession}, got ${result.activeSession}`
        );
      }
    } else {
      result.isValid = false;
      result.errors.push("Active session file not found");
    }

    // Check session directory and chat history
    const sessionPath = path.join(
      targetDir,
      "buildforce",
      "sessions",
      "planned",
      `session-${sessionNumber}`
    );
    const historyPath = path.join(sessionPath, ".chat-history.md");

    if (!fs.existsSync(sessionPath)) {
      result.isValid = false;
      result.errors.push("Session directory not found");
    }

    if (fs.existsSync(historyPath)) {
      result.hasHistory = true;
      const history = fs.readFileSync(historyPath, "utf8");
      if (!history.includes("Hey! What would you like to work on next?")) {
        result.isValid = false;
        result.errors.push("Initial message not found in chat history");
      }
    } else {
      result.isValid = false;
      result.errors.push("Chat history file not found");
    }
  } catch (error) {
    result.isValid = false;
    if (error instanceof Error) {
      result.errors.push(`Verification error: ${error.message}`);
    } else {
      result.errors.push("Unknown error during verification");
    }
  }

  return result;
};

/**
 * Test the plan command functionality
 */
const testPlanCommand = (): void => {
  console.log("Testing plan command functionality:");

  // Create a temporary directory for testing
  const testDir = createTempTestDir();
  console.log(`Created test directory: ${testDir}`);

  try {
    // Set up test environment
    console.log("Setting up test environment...");
    const setupResult = setupTestEnvironment(testDir);
    console.log(`Setup result: ${setupResult ? "Success" : "Failed"}`);

    if (!setupResult) {
      console.log("Failed to set up test environment");
      return;
    }

    // Run the plan command simulation
    console.log("\nSimulating plan command...");
    const planResult = simulatePlanCommand(testDir);
    console.log(
      `Plan command simulation: ${planResult.success ? "Success" : "Failed"}`
    );
    console.log(`New session number: ${planResult.sessionNumber}`);
    console.log("Initial chat history:");
    console.log(planResult.chatHistory);

    // Verify results
    console.log("\nVerifying results...");
    const verification = verifyPlanResults(testDir, planResult.sessionNumber);
    console.log(
      `Verification result: ${verification.isValid ? "Valid" : "Invalid"}`
    );
    console.log(`Active session: ${verification.activeSession}`);
    console.log(`Has chat history: ${verification.hasHistory}`);

    if (!verification.isValid) {
      console.log("\nErrors found:");
      verification.errors.forEach((error) => console.log(` - ${error}`));
    }
  } finally {
    // Clean up
    console.log(`\nCleaning up test directory: ${testDir}`);
    cleanupTempDir(testDir);
    console.log("Test completed.");
  }
};

// Run the test
testPlanCommand();
