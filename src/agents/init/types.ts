import { ProjectAnalyzer, FileTools } from "../../types/project";

export interface InitAgentConfig {
  projectName: string;
  rootDir: string;
  options: {
    skipAnalysis?: boolean;
    force?: boolean;
    verbose?: boolean;
  };
}

export interface InitAgentResult {
  success: boolean;
  documentation: {
    architecture: string;
    specification: string;
  };
  warnings: string[];
  errors: string[];
}

export interface InitAgentDependencies {
  analyzer: ProjectAnalyzer;
  fileTools: FileTools;
}
