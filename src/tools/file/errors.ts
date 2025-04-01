/**
 * Custom error classes for file operations
 */

export class FileOperationError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "FileOperationError";
  }
}

export class FileNotFoundError extends FileOperationError {
  constructor(path: string) {
    super(`File not found: ${path}`);
    this.name = "FileNotFoundError";
  }
}

export class DirectoryNotFoundError extends FileOperationError {
  constructor(path: string) {
    super(`Directory not found: ${path}`);
    this.name = "DirectoryNotFoundError";
  }
}

export class FileWriteError extends FileOperationError {
  constructor(path: string, cause?: unknown) {
    super(`Failed to write file: ${path}`, cause);
    this.name = "FileWriteError";
  }
}

export class FileReadError extends FileOperationError {
  constructor(path: string, cause?: unknown) {
    super(`Failed to read file: ${path}`, cause);
    this.name = "FileReadError";
  }
}
