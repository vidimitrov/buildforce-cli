# Task: Implement Chunked Analysis System

## Overview

Implement a chunked analysis system that will break down project analysis into manageable chunks, prioritize them based on relevance, and process them in order to extract information for architecture.md and specification.md files. This task focuses on creating the core analysis functionality that will be used by the init agent.

## Sub-Tasks

- [x] Create Analysis Module Structure

  - [x] Create `src/analysis/` directory
  - [x] Define core interfaces
  - [x] Set up module exports

- [x] Implement Chunk Management

  - [x] Add chunk creation logic
  - [x] Add chunk prioritization
  - [x] Add chunk dependency tracking
  - [x] Add chunk validation

- [x] Implement Analysis Core

  - [x] Add file scanning
  - [x] Add content analysis
  - [x] Add information extraction
  - [x] Add result aggregation

- [x] Testing
  - [x] Create test utilities
  - [x] Add unit tests
  - [x] Add integration tests
  - [x] Test error scenarios

## Implementation Plan

### 1. Analysis Module Structure

```typescript
// src/analysis/types.ts
interface AnalysisChunk {
  id: string;
  files: string[];
  content: string;
  dependencies: string[];
  relevance: number;
}

interface ProjectAnalysis {
  architecture: {
    techStack: string[];
    projectStructure: string;
    patterns: string[];
  };
  specification: {
    goals: string[];
    components: string[];
    requirements: string[];
  };
}

// src/analysis/chunk.ts
class ChunkManager {
  constructor(private readonly fileTools: FileTools) {}

  async createChunk(files: string[]): Promise<AnalysisChunk>;
  async prioritizeChunks(chunks: AnalysisChunk[]): Promise<AnalysisChunk[]>;
  private async calculateRelevance(chunk: AnalysisChunk): Promise<number>;
  private async findDependencies(chunk: AnalysisChunk): Promise<string[]>;
}

// src/analysis/analyzer.ts
class ProjectAnalyzer {
  constructor(
    private readonly chunkManager: ChunkManager,
    private readonly fileTools: FileTools
  ) {}

  async analyzeProject(): Promise<ProjectAnalysis>;
  private async scanProject(): Promise<string[]>;
  private async analyzeChunk(
    chunk: AnalysisChunk
  ): Promise<Partial<ProjectAnalysis>>;
  private mergeAnalysis(
    analysis: ProjectAnalysis,
    chunkAnalysis: Partial<ProjectAnalysis>
  ): void;
}
```

### 2. Chunk Management Implementation

```typescript
class ChunkManager {
  async createChunk(files: string[]): Promise<AnalysisChunk> {
    const content = await this.readFiles(files);
    const dependencies = await this.findDependencies({
      id: "",
      files,
      content,
      dependencies: [],
      relevance: 0,
    });
    const relevance = await this.calculateRelevance({
      id: "",
      files,
      content,
      dependencies,
      relevance: 0,
    });

    return {
      id: this.generateId(files),
      files,
      content,
      dependencies,
      relevance,
    };
  }

  async prioritizeChunks(chunks: AnalysisChunk[]): Promise<AnalysisChunk[]> {
    return chunks.sort((a, b) => b.relevance - a.relevance);
  }

  private async calculateRelevance(chunk: AnalysisChunk): Promise<number> {
    // Implementation based on file types, content, and location
  }

  private async findDependencies(chunk: AnalysisChunk): Promise<string[]> {
    // Implementation to find related files
  }

  private async readFiles(files: string[]): Promise<string> {
    // Implementation using FileTools
  }

  private generateId(files: string[]): string {
    // Implementation to generate unique chunk ID
  }
}
```

### 3. Analysis Core Implementation

```typescript
class ProjectAnalyzer {
  async analyzeProject(): Promise<ProjectAnalysis> {
    const files = await this.scanProject();
    const chunks = await this.createChunks(files);
    const prioritizedChunks = await this.chunkManager.prioritizeChunks(chunks);

    const analysis: ProjectAnalysis = {
      architecture: { techStack: [], projectStructure: "", patterns: [] },
      specification: { goals: [], components: [], requirements: [] },
    };

    for (const chunk of prioritizedChunks) {
      const chunkAnalysis = await this.analyzeChunk(chunk);
      this.mergeAnalysis(analysis, chunkAnalysis);
    }

    return analysis;
  }

  private async scanProject(): Promise<string[]> {
    // Implementation using FileTools
  }

  private async analyzeChunk(
    chunk: AnalysisChunk
  ): Promise<Partial<ProjectAnalysis>> {
    // Implementation using LLM analysis
  }

  private mergeAnalysis(
    analysis: ProjectAnalysis,
    chunkAnalysis: Partial<ProjectAnalysis>
  ): void {
    // Implementation to merge chunk analysis results
  }
}
```

## Testing

1. Create test utilities:

   - Mock file system
   - Chunk generator
   - Analysis result validator

2. Unit tests for:

   - Chunk management
   - Analysis core
   - Result merging
   - Error handling

3. Integration tests for:
   - Full project analysis
   - Chunk prioritization
   - Information extraction
   - Error scenarios

## Error Handling

- Handle file system errors gracefully
- Manage analysis failures
- Provide clear error messages
- Log operations for debugging
- Allow for recovery from failures

## Dependencies

- FileTools from Task 001
- Graph data structure for chunk dependencies
- LangChain for LLM integration

## Notes

- Keep implementation modular
- Focus on essential analysis first
- Ensure consistent error handling
- Maintain good logging
- Consider adding dry-run mode

## Progress

- [x] Implement `ChunkManager` class for managing file chunks
- [x] Implement `ProjectAnalyzer` class for analyzing project files
- [x] Add comprehensive test coverage
- [x] All tests are passing (10 passed, 0 failed)
- [x] Error handling is in place
- [x] File content extraction is working correctly
- [x] Pattern detection is functioning
- [x] Tech stack analysis is working
- [x] Project structure analysis is implemented
- [x] Component detection is working

## Implementation Details

The chunked analysis system consists of two main components:

1. ChunkManager - handles file chunking and prioritization
2. ProjectAnalyzer - performs project analysis

## Testing

- Unit tests for both ChunkManager and ProjectAnalyzer
- Mock file tools for testing
- Test coverage for error cases

## Recap

- Implemented a robust chunked analysis system with two main components:
  - `ChunkManager`: Handles file chunking, prioritization, and content management
  - `ProjectAnalyzer`: Performs analysis of project architecture and specifications
- Added comprehensive test coverage with 10 passing tests
- Implemented key features:
  - Tech stack extraction from package.json
  - Project structure analysis from README.md
  - Pattern detection in TypeScript/JavaScript files
  - Component and interface detection
  - Error handling and validation
- Key technical decisions:
  - Used file markers for clear content separation
  - Implemented relevance-based chunk prioritization
  - Added graceful error handling with meaningful messages
  - Created reusable test utilities for mock data
