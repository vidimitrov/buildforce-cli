import { ProjectAnalysis as AnalysisProjectAnalysis } from "./types";
import { ProjectAnalysis as CoreProjectAnalysis } from "../types/project";

export class ProjectAnalysisAdapter {
  public static toCoreAnalysis(
    analysis: AnalysisProjectAnalysis,
    projectName: string
  ): CoreProjectAnalysis {
    return {
      name: projectName,
      description: analysis.specification.goals.join(", "),
      dependencies: analysis.architecture.techStack,
      structure: {
        files: [], // Will be populated by the analyzer
        directories: [], // Will be populated by the analyzer
      },
      type: "node", // Default to node since we're using TypeScript
      frameworks: analysis.architecture.patterns,
      buildTools: [], // Will be populated by the analyzer
      testFrameworks: [], // Will be populated by the analyzer
    };
  }
}
