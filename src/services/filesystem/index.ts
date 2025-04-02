import * as fs from "fs";
import * as path from "path";

/**
 * Checks if the buildforce folder exists in the specified directory
 * @param dir Directory to check, defaults to current working directory
 * @returns boolean indicating if the project is initialized
 */
export const isBuildforceInitialized = (
  dir: string = process.cwd()
): boolean => {
  try {
    const buildforceDir = path.join(dir, "buildforce");
    return fs.existsSync(buildforceDir);
  } catch (error) {
    return false;
  }
};

/**
 * Gets the path to the active session
 * @returns Path to the active session or null if not found
 */
export const getActiveSessionPath = (): string | null => {
  const activeSessionFilePath = path.join(
    process.cwd(),
    "buildforce",
    "sessions",
    ".active-session"
  );

  try {
    if (fs.existsSync(activeSessionFilePath)) {
      const activeSession = fs
        .readFileSync(activeSessionFilePath, "utf8")
        .trim();
      if (activeSession) {
        return path.join(
          process.cwd(),
          "buildforce",
          "sessions",
          activeSession
        );
      }
    }
    return null;
  } catch (error) {
    console.warn("Warning: Could not read active session:", error);
    return null;
  }
};

/**
 * Gets the current chat history
 * @returns Chat history content or default message if not available
 */
export const getChatHistory = (): string => {
  const activeSessionPath = getActiveSessionPath();
  if (activeSessionPath) {
    const chatHistoryPath = path.join(activeSessionPath, ".chat-history.md");
    try {
      if (fs.existsSync(chatHistoryPath)) {
        return fs.readFileSync(chatHistoryPath, "utf8");
      }
    } catch (error) {
      console.warn("Warning: Could not read chat history:", error);
    }
  }
  return "No chat history available.";
};

/**
 * Updates the chat history with a new message
 * @param role Role of the message sender (User or Assistant)
 * @param content Content of the message
 */
export const updateChatHistory = async (
  role: "User" | "Assistant",
  content: string
): Promise<void> => {
  const activeSessionPath = getActiveSessionPath();
  if (!activeSessionPath) {
    console.warn("Warning: No active session to update chat history");
    return;
  }

  const chatHistoryPath = path.join(activeSessionPath, ".chat-history.md");
  const timestamp = new Date().toISOString();
  const entry = `\n## ${timestamp} | ${role}\n\n${content}\n`;

  try {
    fs.appendFileSync(chatHistoryPath, entry);
  } catch (error) {
    console.error("Error updating chat history:", error);
    throw error;
  }
};

/**
 * Reads a context file with fallback to default content
 * @param filePath Path to the context file
 * @param defaultContent Default content if file cannot be read
 * @returns Content of the file or default content
 */
export const readContextFile = (
  filePath: string,
  defaultContent = ""
): string => {
  try {
    return fs.readFileSync(path.join(process.cwd(), filePath), "utf8");
  } catch (error) {
    console.warn(`Warning: Could not read ${filePath}:`, error);
    return defaultContent;
  }
};
