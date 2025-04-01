# Task: Implement Chunked Analysis System

## Overview

Implement a chunked analysis system that will break down project analysis into manageable chunks, prioritize them based on relevance, and process them in order to extract information for architecture.md and specification.md files. This task focuses on creating the core analysis functionality that will be used by the init agent.

## Sub-Tasks

- [ ] Create Analysis Module Structure

  - [ ] Create `src/analysis/` directory
  - [ ] Define core interfaces
  - [ ] Set up module exports

- [ ] Implement Chunk Management

  - [ ] Add chunk creation logic
  - [ ] Add chunk prioritization
  - [ ] Add chunk dependency tracking
  - [ ] Add chunk validation

- [ ] Implement Analysis Core

  - [ ] Add file scanning
  - [ ] Add content analysis
  - [ ] Add information extraction
  - [ ] Add result aggregation

- [ ] Testing
  - [ ] Create test utilities
  - [ ] Add unit tests
  - [ ] Add integration tests
  - [ ] Test error scenarios

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
