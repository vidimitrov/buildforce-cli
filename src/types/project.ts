export interface ProjectAnalysis {
  name: string;
  description: string;
  dependencies: string[];
  structure: {
    files: string[];
    directories: string[];
  };
  type: "node" | "python" | "java" | "other";
  frameworks: string[];
  buildTools: string[];
  testFrameworks: string[];
}

export interface ProjectAnalyzer {
  analyzeProject(rootDir: string): Promise<ProjectAnalysis>;
}

export interface FileTools {
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  exists(path: string): Promise<boolean>;
  mkdir(path: string): Promise<void>;
}
