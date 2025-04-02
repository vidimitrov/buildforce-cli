import * as fs from "fs";
import * as path from "path";

/**
 * Gets the next session number
 * @returns Next session number (e.g., "004" if last session was "003")
 */
export const getNextSessionNumber = (): string => {
  const sessionsDir = path.join(process.cwd(), "buildforce", "sessions");
  const completedDir = path.join(sessionsDir, "completed");
  const plannedDir = path.join(sessionsDir, "planned");

  let maxNumber = 0;

  // Helper to scan directory for session numbers
  const scanDir = (dir: string) => {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir);
    for (const entry of entries) {
      const match = entry.match(/^session-(\d{3})/);
      if (match) {
        const num = parseInt(match[1]);
        maxNumber = Math.max(maxNumber, num);
      }
    }
  };

  // Scan both completed and planned directories
  scanDir(completedDir);
  scanDir(plannedDir);

  // Format next number with leading zeros
  return String(maxNumber + 1).padStart(3, "0");
};

/**
 * Creates a new planning session
 * @returns Path to the new session
 */
export const createNewSession = (): string => {
  const nextNumber = getNextSessionNumber();
  const sessionName = `session-${nextNumber}`;
  const sessionPath = path.join(
    process.cwd(),
    "buildforce",
    "sessions",
    "planned",
    sessionName
  );

  // Create session directory and chat history file
  fs.mkdirSync(sessionPath, { recursive: true });
  fs.writeFileSync(path.join(sessionPath, ".chat-history.md"), "");

  // Update active session file
  const activeSessionPath = path.join(
    process.cwd(),
    "buildforce",
    "sessions",
    ".active-session"
  );
  fs.writeFileSync(activeSessionPath, `planned/${sessionName}\n`);

  return sessionPath;
};
