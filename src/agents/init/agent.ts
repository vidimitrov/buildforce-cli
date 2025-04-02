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
} from "../../types/templates";
import { ProjectAnalyzer, FileTools } from "../../types/project";
import { ProjectUtils } from "../../tools/file/types";

export class InitAgent {
  private warnings: string[] = [];
  private errors: string[] = [];
  private eta: Eta;

  constructor(
    private config: InitAgentConfig,
    private analyzer: ProjectAnalyzer,
    private fileTools: FileTools,
    private projectUtils: ProjectUtils
  ) {
    this.eta = new Eta();
  }

  private log(message: string, data?: any) {
    if (this.config.options.devMode) {
      console.log(
        `[InitAgent] ${message}`,
        data ? JSON.stringify(data, null, 2) : ""
      );
    }
  }

  async execute(): Promise<InitAgentResult> {
    try {
      this.log("Starting project initialization");

      // 1. Analyze project
      this.log("Step 1: Analyzing project");
      const analysis = await this.analyzeProject();
      this.log("Project analysis completed", analysis);

      // 2. Generate documentation
      this.log("Step 2: Generating documentation");
      await this.generateDocumentation(analysis);
      this.log("Documentation generation completed");

      // 3. Validate results
      this.log("Step 3: Validating results");
      const isValid = await this.validateResults();
      this.log("Validation completed", { isValid });

      const result = {
        success: isValid,
        documentation: {
          architecture: await this.fileTools.readFile(
            "buildforce/memory/architecture.md"
          ),
          specification: await this.fileTools.readFile(
            "buildforce/memory/specification.md"
          ),
        },
        warnings: this.warnings,
        errors: this.errors,
      };

      this.log("Initialization completed successfully", result);
      return result;
    } catch (error: unknown) {
      this.log("Initialization failed", {
        error: error instanceof Error ? error.message : error,
      });
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
    try {
      this.log("Starting project analysis");

      // Get all files in the project using ProjectUtils
      const files = await this.projectUtils.listDirectory(".");
      this.log("Found files in project", files);

      // Filter out node_modules and other special directories
      const validFiles = files.filter((file: string) => {
        const isNodeModules = file.includes("node_modules");
        const isGit = file.includes(".git");
        const isDist = file.includes("/dist/");
        return !isNodeModules && !isGit && !isDist;
      });
      this.log("Filtered valid files", validFiles);

      // Analyze the project
      this.log("Running project analyzer");
      const analysis = await this.analyzer.analyzeProject(this.config.rootDir);
      this.log("Raw analysis result", analysis);

      // Validate the analysis
      if (!analysis || !analysis.name) {
        this.log("Analysis validation failed", {
          hasAnalysis: !!analysis,
          hasName: !!analysis?.name,
        });
        this.errors.push(
          "Project analysis failed to generate required documentation"
        );
        throw new Error(
          "Project analysis failed to generate required documentation"
        );
      }

      // Ensure we have at least some meaningful information
      const hasMeaningfulInfo =
        analysis.frameworks.length > 0 ||
        analysis.buildTools.length > 0 ||
        analysis.testFrameworks.length > 0 ||
        analysis.structure.files.length > 0 ||
        analysis.structure.directories.length > 0;

      this.log("Meaningful info check", {
        hasFrameworks: analysis.frameworks.length > 0,
        hasBuildTools: analysis.buildTools.length > 0,
        hasTestFrameworks: analysis.testFrameworks.length > 0,
        hasFiles: analysis.structure.files.length > 0,
        hasDirectories: analysis.structure.directories.length > 0,
        hasMeaningfulInfo,
      });

      if (!hasMeaningfulInfo) {
        this.log("No meaningful information found in analysis");
        this.errors.push(
          "Project analysis failed to extract meaningful information"
        );
        throw new Error(
          "Project analysis failed to extract meaningful information"
        );
      }

      return analysis;
    } catch (error: unknown) {
      this.log("Project analysis failed", {
        error: error instanceof Error ? error.message : error,
      });
      this.errors.push(
        `Failed to analyze project: ${
          error instanceof Error ? error.message : "Unknown error occurred"
        }`
      );
      throw error;
    }
  }

  private async generateDocumentation(
    analysis: ProjectAnalysis
  ): Promise<void> {
    try {
      this.log("Starting documentation generation");

      // Ensure memory directory exists
      this.log("Creating memory directory");
      await this.fileTools.mkdir("buildforce/memory");

      this.log("Generating architecture documentation");
      const architectureContent = await this.generateArchitectureDoc(analysis);

      this.log("Generating specification documentation");
      const specificationContent = await this.generateSpecificationDoc(
        analysis
      );

      // Save to memory directory
      this.log("Saving documentation files");
      await this.fileTools.writeFile(
        "buildforce/memory/architecture.md",
        architectureContent
      );
      await this.fileTools.writeFile(
        "buildforce/memory/specification.md",
        specificationContent
      );

      this.log("Documentation generation completed");
    } catch (error) {
      this.log("Documentation generation failed", {
        error: error instanceof Error ? error.message : error,
      });
      this.errors.push("Documentation files were not generated successfully");
      throw error;
    }
  }

  private async generateArchitectureDoc(
    analysis: ProjectAnalysis
  ): Promise<string> {
    try {
      this.log("Preparing architecture documentation data");
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
      this.log("Architecture template data", templateData);

      this.log("Reading architecture template");
      const template = await this.fileTools.readFile(
        "buildforce/templates/architecture-template.eta"
      );
      this.log("Template loaded successfully");

      this.log("Rendering architecture documentation");
      const result = this.eta.renderString(template, templateData);
      this.log("Architecture documentation rendered successfully");
      return result;
    } catch (error) {
      this.log("Architecture documentation generation failed", {
        error: error instanceof Error ? error.message : error,
      });
      this.errors.push("Failed to generate architecture documentation");
      throw error;
    }
  }

  private async generateSpecificationDoc(
    analysis: ProjectAnalysis
  ): Promise<string> {
    try {
      this.log("Preparing specification documentation data");
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
      this.log("Specification template data", templateData);

      this.log("Reading specification template");
      const template = await this.fileTools.readFile(
        "buildforce/templates/specification-template.eta"
      );
      this.log("Template loaded successfully");

      this.log("Rendering specification documentation");
      const result = this.eta.renderString(template, templateData);
      this.log("Specification documentation rendered successfully");
      return result;
    } catch (error) {
      this.log("Specification documentation generation failed", {
        error: error instanceof Error ? error.message : error,
      });
      this.errors.push("Failed to generate specification documentation");
      throw error;
    }
  }

  private async validateResults(): Promise<boolean> {
    try {
      this.log("Starting results validation");

      this.log("Checking architecture documentation");
      const architectureExists = await this.fileTools.exists(
        "buildforce/memory/architecture.md"
      );

      this.log("Checking specification documentation");
      const specificationExists = await this.fileTools.exists(
        "buildforce/memory/specification.md"
      );

      this.log("Validation results", {
        architectureExists,
        specificationExists,
      });

      if (!architectureExists || !specificationExists) {
        this.log("Documentation files missing");
        this.errors.push("Documentation files were not generated successfully");
        return false;
      }

      this.log("Validation completed successfully");
      return true;
    } catch (error) {
      this.log("Validation failed", {
        error: error instanceof Error ? error.message : error,
      });
      this.errors.push("Documentation files were not generated successfully");
      return false;
    }
  }
}
