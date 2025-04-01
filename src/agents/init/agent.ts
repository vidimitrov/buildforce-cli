import {
  InitAgentConfig,
  InitAgentResult,
  InitAgentDependencies,
} from "./types";
import { ProjectAnalysis } from "../../types/project";

export class InitAgent {
  private warnings: string[] = [];
  private errors: string[] = [];

  constructor(
    private config: InitAgentConfig,
    private dependencies: InitAgentDependencies
  ) {}

  async execute(): Promise<InitAgentResult> {
    try {
      // 1. Analyze project
      const analysis = await this.analyzeProject();

      // 2. Generate documentation
      await this.generateDocumentation(analysis);

      // 3. Validate results
      const isValid = await this.validateResults();

      return {
        success: isValid,
        documentation: {
          architecture: await this.dependencies.fileTools.readFile(
            "architecture.md"
          ),
          specification: await this.dependencies.fileTools.readFile(
            "specification.md"
          ),
        },
        warnings: this.warnings,
        errors: this.errors,
      };
    } catch (error) {
      return {
        success: false,
        documentation: { architecture: "", specification: "" },
        warnings: this.warnings,
        errors: [
          ...this.errors,
          error instanceof Error ? error.message : "Unknown error occurred",
        ],
      };
    }
  }

  private async analyzeProject(): Promise<ProjectAnalysis> {
    if (this.config.options.skipAnalysis) {
      this.warnings.push("Project analysis skipped as per configuration");
      return {
        name: this.config.projectName,
        description: "",
        dependencies: [],
        structure: { files: [], directories: [] },
        type: "other",
        frameworks: [],
        buildTools: [],
        testFrameworks: [],
      };
    }

    return this.dependencies.analyzer.analyzeProject(this.config.rootDir);
  }

  private async generateDocumentation(
    analysis: ProjectAnalysis
  ): Promise<void> {
    const architectureContent = this.generateArchitectureDoc(analysis);
    const specificationContent = this.generateSpecificationDoc(analysis);

    await this.dependencies.fileTools.writeFile(
      "architecture.md",
      architectureContent
    );
    await this.dependencies.fileTools.writeFile(
      "specification.md",
      specificationContent
    );
  }

  private generateArchitectureDoc(analysis: ProjectAnalysis): string {
    return `# ${analysis.name} Architecture

## Project Overview
${analysis.description}

## Project Structure
- Type: ${analysis.type}
- Frameworks: ${analysis.frameworks.join(", ")}
- Build Tools: ${analysis.buildTools.join(", ")}
- Test Frameworks: ${analysis.testFrameworks.join(", ")}

## Dependencies
${analysis.dependencies.map((dep) => `- ${dep}`).join("\n")}

## Directory Structure
${analysis.structure.directories.map((dir) => `- ${dir}`).join("\n")}
`;
  }

  private generateSpecificationDoc(analysis: ProjectAnalysis): string {
    return `# ${analysis.name} Specification

## Project Details
- Name: ${analysis.name}
- Type: ${analysis.type}
- Description: ${analysis.description}

## Technical Stack
- Frameworks: ${analysis.frameworks.join(", ")}
- Build Tools: ${analysis.buildTools.join(", ")}
- Test Frameworks: ${analysis.testFrameworks.join(", ")}

## Dependencies
${analysis.dependencies.map((dep) => `- ${dep}`).join("\n")}

## Project Structure
${analysis.structure.files.map((file) => `- ${file}`).join("\n")}
`;
  }

  private async validateResults(): Promise<boolean> {
    const architectureExists = await this.dependencies.fileTools.exists(
      "architecture.md"
    );
    const specificationExists = await this.dependencies.fileTools.exists(
      "specification.md"
    );

    if (!architectureExists || !specificationExists) {
      this.errors.push("Documentation files were not generated successfully");
      return false;
    }

    return true;
  }
}
