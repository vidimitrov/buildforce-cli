import { ProjectAnalyzer, FileTools } from "../../types/project";
import { ProjectUtils } from "../../tools/file/types";

export interface InitAgentConfig {
  projectName: string;
  rootDir: string;
  options: {
    skipAnalysis?: boolean;
    force?: boolean;
    verbose?: boolean;
    devMode?: boolean;
  };
}

export interface InitAgentDependencies {
  analyzer: ProjectAnalyzer;
  fileTools: FileTools;
  projectUtils: ProjectUtils;
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
