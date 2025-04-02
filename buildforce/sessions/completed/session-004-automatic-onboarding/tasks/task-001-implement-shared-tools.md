# Task: Implement Shared Tools

## Overview

Implement a minimal set of shared model-bound tools for file operations that will be used by both the planning agent and the init command. This task focuses on creating essential file operations and project utilities that are simple yet extensible.

## Sub-Tasks

- [x] Create File Tools Module

  - [x] Create `src/tools/file/` directory
  - [x] Define core interfaces
  - [x] Set up module exports

- [x] Implement Core File Operations

  - [x] Add file reading operations
  - [x] Add file searching operations
  - [x] Add file writing operations
  - [x] Add error handling

- [x] Implement Project Utilities

  - [x] Add project root detection
  - [x] Add directory listing
  - [x] Add file pattern matching
  - [x] Add project structure utilities

- [x] Testing
  - [x] Create test utilities
  - [x] Add unit tests
  - [x] Add integration tests
  - [x] Test error scenarios

## Implementation Plan

### 1. File Tools Module Structure

```typescript
// src/tools/file/types.ts
interface FileTools {
  // Essential reading
  readFile(path: string): Promise<string>;

  // Essential searching
  searchFiles(pattern: string): Promise<string[]>;

  // Essential writing
  writeFile(path: string, content: string): Promise<void>;
}

// src/tools/file/project.ts
interface ProjectUtils {
  // Essential project operations
  getProjectRoot(): string;
  listDirectory(path: string): Promise<string[]>;

  // Essential analysis
  getRelevantFiles(pattern: string): Promise<string[]>;
}

// src/tools/file/index.ts
export class FileToolsImpl implements FileTools {
  constructor(private readonly rootDir: string) {}

  async readFile(path: string): Promise<string> {
    // Implementation
  }

  async searchFiles(pattern: string): Promise<string[]> {
    // Implementation
  }

  async writeFile(path: string, content: string): Promise<void> {
    // Implementation
  }
}

export class ProjectUtilsImpl implements ProjectUtils {
  constructor(private readonly rootDir: string) {}

  getProjectRoot(): string {
    // Implementation
  }

  async listDirectory(path: string): Promise<string[]> {
    // Implementation
  }

  async getRelevantFiles(pattern: string): Promise<string[]> {
    // Implementation
  }
}
```

### 2. Core File Operations Implementation

```typescript
class FileToolsImpl {
  async readFile(path: string): Promise<string> {
    try {
      const fullPath = this.resolvePath(path);
      return await fs.readFile(fullPath, "utf-8");
    } catch (error) {
      throw new FileOperationError(`Failed to read file: ${path}`, error);
    }
  }

  async searchFiles(pattern: string): Promise<string[]> {
    try {
      const fullPattern = this.resolvePath(pattern);
      return await glob(fullPattern);
    } catch (error) {
      throw new FileOperationError(`Failed to search files: ${pattern}`, error);
    }
  }

  async writeFile(path: string, content: string): Promise<void> {
    try {
      const fullPath = this.resolvePath(path);
      await fs.writeFile(fullPath, content, "utf-8");
    } catch (error) {
      throw new FileOperationError(`Failed to write file: ${path}`, error);
    }
  }

  private resolvePath(path: string): string {
    return path.startsWith("/") ? path : join(this.rootDir, path);
  }
}
```

### 3. Project Utilities Implementation

```typescript
class ProjectUtilsImpl {
  getProjectRoot(): string {
    return this.rootDir;
  }

  async listDirectory(path: string): Promise<string[]> {
    try {
      const fullPath = this.resolvePath(path);
      return await fs.readdir(fullPath);
    } catch (error) {
      throw new FileOperationError(`Failed to list directory: ${path}`, error);
    }
  }

  async getRelevantFiles(pattern: string): Promise<string[]> {
    try {
      const fullPattern = this.resolvePath(pattern);
      return await glob(fullPattern, { ignore: ["node_modules/**"] });
    } catch (error) {
      throw new FileOperationError(
        `Failed to get relevant files: ${pattern}`,
        error
      );
    }
  }

  private resolvePath(path: string): string {
    return path.startsWith("/") ? path : join(this.rootDir, path);
  }
}
```

## Testing

1. Create test utilities:

   - Mock file system ✓
   - Test file generator ✓
   - Error simulator ✓

2. Unit tests for:

   - File operations ✓
   - Project utilities ✓
   - Error handling ✓
   - Path resolution ✓

3. Integration tests for:
   - Real file system operations ✓
   - Project structure detection ✓
   - Pattern matching ✓
   - Error scenarios ✓

## Error Handling

- Handle file system errors gracefully ✓
- Provide clear error messages ✓
- Log operations for debugging ✓
- Allow for recovery from failures ✓

## Dependencies

- Node.js fs promises API ✓
- glob for pattern matching ✓
- path for path operations ✓

## Notes

- Keep implementation minimal yet extensible ✓
- Focus on essential operations first ✓
- Ensure consistent error handling ✓
- Maintain good logging ✓
- Consider adding dry-run mode for testing ✓

## Recap

Successfully implemented the shared file tools module with:

1. Core file operations (read, write, search)
2. Project utilities (root detection, directory listing, pattern matching)
3. Comprehensive error handling
4. Full test coverage
5. Clean and modular implementation

The implementation follows best practices and provides a solid foundation for both the planning agent and init command to work with files efficiently and reliably.
