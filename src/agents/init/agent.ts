import {
  InitAgentConfig,
  InitAgentResult,
  InitAgentDependencies,
} from "./types";
import { ProjectAnalysis } from "../../types/project";
import { Eta } from "eta";
import {
  ArchitectureTemplateData,
  SpecificationTemplateData,
} from "../../templates/buildforce/types";

export class InitAgent {
  private warnings: string[] = [];
  private errors: string[] = [];
  private eta: Eta;

  constructor(
    private config: InitAgentConfig,
    private dependencies: InitAgentDependencies
  ) {
    this.eta = new Eta();
  }

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
            "buildforce/memory/architecture.md"
          ),
          specification: await this.dependencies.fileTools.readFile(
            "buildforce/memory/specification.md"
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
    try {
      // Ensure memory directory exists
      await this.dependencies.fileTools.mkdir("buildforce/memory");

      const architectureContent = await this.generateArchitectureDoc(analysis);
      const specificationContent = await this.generateSpecificationDoc(
        analysis
      );

      // Save to memory directory
      await this.dependencies.fileTools.writeFile(
        "buildforce/memory/architecture.md",
        architectureContent
      );
      await this.dependencies.fileTools.writeFile(
        "buildforce/memory/specification.md",
        specificationContent
      );
    } catch (error) {
      this.errors.push("Documentation files were not generated successfully");
      throw error;
    }
  }

  private async generateArchitectureDoc(
    analysis: ProjectAnalysis
  ): Promise<string> {
    try {
      const templateData: ArchitectureTemplateData = {
        description: analysis.description,
        frameworks: analysis.frameworks,
        runtime: analysis.runtime || "",
        language: analysis.language || "",
        testFrameworks: analysis.testFrameworks,
        dependencies: analysis.dependencies,
        buildTools: analysis.buildTools,
        structure: analysis.structure,
      };

      const template = await this.dependencies.fileTools.readFile(
        "src/templates/buildforce/templates/architecture-template.eta"
      );
      return this.eta.renderString(template, templateData);
    } catch (error) {
      this.errors.push("Failed to generate architecture documentation");
      throw error;
    }
  }

  private async generateSpecificationDoc(
    analysis: ProjectAnalysis
  ): Promise<string> {
    try {
      const templateData: SpecificationTemplateData = {
        name: analysis.name,
        description: analysis.description,
        components: [
          {
            name: "Core Application",
            technologies: analysis.frameworks,
            architecture:
              analysis.architecture || "Standard application architecture",
            responsibilities: "Core application functionality",
            implementation: "Implementation based on project requirements",
            features: analysis.features || [],
            integrationPoints: analysis.integrationPoints || [],
            considerations: analysis.considerations || [],
          },
          {
            name: "Project Analysis",
            technologies: analysis.frameworks,
            architecture:
              "Analysis system for project structure and dependencies",
            responsibilities:
              "Project structure analysis and dependency management",
            implementation: "Automated analysis with configurable options",
            features: [
              "Project structure analysis",
              "Dependency detection",
              "Framework identification",
            ],
            integrationPoints: [
              "File system",
              "Package management",
              "Build tools",
            ],
            considerations: [
              "Support for multiple project types",
              "Extensible analysis framework",
              "Configurable analysis options",
            ],
          },
        ],
        type: analysis.type,
        buildTools: analysis.buildTools,
        testFrameworks: analysis.testFrameworks,
        futureExpansions: analysis.futureExpansions || [],
        integrationCapabilities: analysis.integrationCapabilities || [],
      };

      const template = await this.dependencies.fileTools.readFile(
        "src/templates/buildforce/templates/specification-template.eta"
      );
      return this.eta.renderString(template, templateData);
    } catch (error) {
      this.errors.push("Failed to generate specification documentation");
      throw error;
    }
  }

  private async validateResults(): Promise<boolean> {
    try {
      const architectureExists = await this.dependencies.fileTools.exists(
        "buildforce/memory/architecture.md"
      );
      const specificationExists = await this.dependencies.fileTools.exists(
        "buildforce/memory/specification.md"
      );

      if (!architectureExists || !specificationExists) {
        this.errors.push("Documentation files were not generated successfully");
        return false;
      }

      return true;
    } catch (error) {
      this.errors.push("Documentation files were not generated successfully");
      return false;
    }
  }
}
