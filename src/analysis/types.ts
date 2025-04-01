/**
 * Represents a chunk of project files to be analyzed
 */
export interface AnalysisChunk {
  id: string;
  files: string[];
  content: string;
  dependencies: string[];
  relevance: number;
}

/**
 * Represents the complete project analysis results
 */
export interface ProjectAnalysis {
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

/**
 * Configuration options for the analysis system
 */
export interface AnalysisConfig {
  maxChunkSize: number;
  minRelevance: number;
  maxDependencies: number;
}

/**
 * Result of analyzing a single chunk
 */
export interface ChunkAnalysisResult {
  chunkId: string;
  architecture?: Partial<ProjectAnalysis["architecture"]>;
  specification?: Partial<ProjectAnalysis["specification"]>;
  errors?: string[];
}

/**
 * Error types that can occur during analysis
 */
export enum AnalysisError {
  FILE_READ_ERROR = "FILE_READ_ERROR",
  CHUNK_CREATION_ERROR = "CHUNK_CREATION_ERROR",
  ANALYSIS_ERROR = "ANALYSIS_ERROR",
  MERGE_ERROR = "MERGE_ERROR",
}

/**
 * Custom error class for analysis-related errors
 */
export class AnalysisSystemError extends Error {
  constructor(
    public type: AnalysisError,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "AnalysisSystemError";
  }
}
