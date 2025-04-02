/**
 * Core interfaces for file operations
 */

export interface FileTools {
  /**
   * Read a file's contents
   * @param path Path to the file
   * @returns Promise resolving to file contents
   */
  readFile(path: string): Promise<string>;

  /**
   * Search for files matching a pattern
   * @param pattern Glob pattern to match
   * @returns Promise resolving to array of matching file paths
   */
  searchFiles(pattern: string): Promise<string[]>;

  /**
   * Write content to a file
   * @param path Path to the file
   * @param content Content to write
   * @returns Promise resolving when write is complete
   */
  writeFile(path: string, content: string): Promise<void>;

  /**
   * Check if a file or directory exists
   * @param path Path to check
   * @returns Promise resolving to true if the path exists
   */
  exists(path: string): Promise<boolean>;

  /**
   * Create a directory
   * @param path Path to create
   * @returns Promise resolving when directory is created
   */
  mkdir(path: string): Promise<void>;
}

export interface ProjectUtils {
  /**
   * Get the project root directory
   * @returns Project root directory path
   */
  getProjectRoot(): string;

  /**
   * List contents of a directory
   * @param path Path to the directory
   * @returns Promise resolving to array of directory contents
   */
  listDirectory(path: string): Promise<string[]>;

  /**
   * Get files matching a pattern, excluding node_modules
   * @param pattern Glob pattern to match
   * @returns Promise resolving to array of matching file paths
   */
  getRelevantFiles(pattern: string): Promise<string[]>;
}
