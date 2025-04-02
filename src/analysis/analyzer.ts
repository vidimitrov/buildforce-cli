import {
  AnalysisChunk,
  ProjectAnalysis as AnalysisProjectAnalysis,
  ChunkAnalysisResult,
  AnalysisError,
  AnalysisSystemError,
} from "./types";
import { ChunkManager } from "./chunk";
import { FileTools } from "../tools/file/types";
import {
  ProjectAnalyzer as CoreProjectAnalyzer,
  ProjectAnalysis as CoreProjectAnalysis,
} from "../types/project";
import { ProjectAnalysisAdapter } from "./adapter";

/**
 * Main class responsible for analyzing project files and generating architecture and specification information
 */
export class ProjectAnalyzer implements CoreProjectAnalyzer {
  constructor(
    private readonly chunkManager: ChunkManager,
    private readonly fileTools: FileTools
  ) {}

  /**
   * Analyzes the entire project and generates architecture and specification information
   */
  public async analyzeProject(rootDir: string): Promise<CoreProjectAnalysis> {
    const analysis = await this.analyzeProjectInternal();
    const projectName = this.extractProjectName(rootDir);

    // Get all files and directories
    const files = await this.fileTools.searchFiles("*");
    const directories = new Set<string>();
    files.forEach((file) => {
      const dir = file.split("/").slice(0, -1).join("/");
      if (dir) directories.add(dir);
    });

    // Extract build tools and test frameworks from package.json
    const buildTools: string[] = [];
    const testFrameworks: string[] = [];
    const packageJsonPath = `${rootDir}/package.json`;

    try {
      if (await this.fileTools.exists(packageJsonPath)) {
        const packageJson = JSON.parse(
          await this.fileTools.readFile(packageJsonPath)
        );
        const devDeps = packageJson.devDependencies || {};

        // Common build tools
        if (devDeps["webpack"]) buildTools.push("webpack");
        if (devDeps["rollup"]) buildTools.push("rollup");
        if (devDeps["parcel"]) buildTools.push("parcel");
        if (devDeps["esbuild"]) buildTools.push("esbuild");
        if (devDeps["vite"]) buildTools.push("vite");

        // Common test frameworks
        if (devDeps["jest"]) testFrameworks.push("jest");
        if (devDeps["mocha"]) testFrameworks.push("mocha");
        if (devDeps["jasmine"]) testFrameworks.push("jasmine");
        if (devDeps["vitest"]) testFrameworks.push("vitest");
        if (devDeps["ava"]) testFrameworks.push("ava");
      }
    } catch (error) {
      console.error("Error parsing package.json:", error);
    }

    const analysisResult = ProjectAnalysisAdapter.toCoreAnalysis(
      analysis,
      projectName
    );

    // Update with the additional information
    analysisResult.structure.files = files;
    analysisResult.structure.directories = Array.from(directories);
    analysisResult.buildTools = buildTools;
    analysisResult.testFrameworks = testFrameworks;

    return analysisResult;
  }

  /**
   * Extracts the project name from the root directory
   */
  private extractProjectName(rootDir: string): string {
    return rootDir.split("/").pop() || "unknown";
  }

  /**
   * Internal method that performs the actual analysis
   */
  private async analyzeProjectInternal(): Promise<AnalysisProjectAnalysis> {
    const analysis: AnalysisProjectAnalysis = {
      architecture: {
        techStack: [],
        projectStructure: "",
        patterns: [],
      },
      specification: {
        goals: [],
        components: [],
        requirements: [],
      },
    };

    const errors: Error[] = [];
    const allPaths = await this.fileTools.searchFiles("**/*");
    console.log("Found all paths:", allPaths);

    // Filter out directories and only keep files
    const files = await Promise.all(
      allPaths.map(async (path) => {
        try {
          const exists = await this.fileTools.exists(path);
          return exists ? path : null;
        } catch (error) {
          console.warn(`Warning: Could not check path ${path}:`, error);
          return null;
        }
      })
    ).then((paths) => paths.filter((path): path is string => path !== null));

    console.log("Filtered files:", files);

    if (files.length === 0) {
      throw new AnalysisSystemError(
        AnalysisError.FILE_READ_ERROR,
        "No files found in the project"
      );
    }

    // Create a single chunk with all files
    const chunk: AnalysisChunk = {
      id: "main",
      files,
      content: await Promise.all(
        files.map(async (file) => {
          try {
            const content = await this.fileTools.readFile(file);
            return `=== ${file} ===\n${content}\n=== end ${file} ===`;
          } catch (error) {
            console.warn(`Warning: Could not read file ${file}:`, error);
            return null;
          }
        })
      ).then((contents) =>
        contents
          .filter((content): content is string => content !== null)
          .join("\n")
      ),
      dependencies: [], // We'll extract dependencies during analysis
      relevance: 1.0, // Main chunk has highest relevance
    };
    console.log("Created chunk:", chunk.id);

    // Analyze the chunk
    console.log("Analyzing chunk:", chunk.id);
    try {
      const chunkAnalysis = await this.analyzeChunk(chunk);
      this.mergeAnalysis(analysis, chunkAnalysis);
    } catch (error) {
      errors.push(error as Error);
      console.error(`Failed to analyze chunk ${chunk.id}:`, error);
    }

    // Check if we have any meaningful information
    const hasArchitectureInfo =
      analysis.architecture.techStack.length > 0 ||
      analysis.architecture.projectStructure.length > 0 ||
      analysis.architecture.patterns.length > 0;
    const hasSpecificationInfo =
      analysis.specification.goals.length > 0 ||
      analysis.specification.components.length > 0 ||
      analysis.specification.requirements.length > 0;

    console.log("Analysis result:", {
      hasArchitectureInfo,
      hasSpecificationInfo,
      analysis: JSON.stringify(analysis, null, 2),
      errors: errors.map((e) => e.message),
    });

    // If we have no meaningful information and there are errors, throw the first error
    if (!hasArchitectureInfo && !hasSpecificationInfo && errors.length > 0) {
      throw errors[0];
    }

    return analysis;
  }

  /**
   * Analyzes a single chunk and extracts relevant information
   */
  private async analyzeChunk(
    chunk: AnalysisChunk
  ): Promise<ChunkAnalysisResult> {
    const architecture = await this.extractArchitectureInfo(chunk);
    const specification = await this.extractSpecificationInfo(chunk);

    // Check if we have any meaningful information
    const hasMeaningfulArchitecture =
      architecture.techStack.length > 0 ||
      architecture.projectStructure.length > 0 ||
      architecture.patterns.length > 0;
    const hasMeaningfulSpecification =
      specification.goals.length > 0 ||
      specification.components.length > 0 ||
      specification.requirements.length > 0;

    if (!hasMeaningfulArchitecture && !hasMeaningfulSpecification) {
      throw new Error("No meaningful information extracted from chunk");
    }

    return {
      chunkId: chunk.id,
      architecture,
      specification,
    };
  }

  /**
   * Extracts architecture-related information from a chunk
   */
  private async extractArchitectureInfo(
    chunk: AnalysisChunk
  ): Promise<AnalysisProjectAnalysis["architecture"]> {
    const info: AnalysisProjectAnalysis["architecture"] = {
      techStack: [],
      projectStructure: "",
      patterns: [],
    };

    // Extract tech stack from package.json
    if (chunk.files.some((f) => f.endsWith("package.json"))) {
      try {
        // Find the package.json content between markers
        const packageJsonMatch = chunk.content.match(
          /=== package\.json ===\n([\s\S]*?)\n=== end package\.json ===/
        );
        if (packageJsonMatch) {
          const packageJsonContent = packageJsonMatch[1].trim();
          try {
            const packageJson = JSON.parse(packageJsonContent);
            if (packageJson && typeof packageJson === "object") {
              // Extract dependencies and devDependencies
              const dependencies = packageJson.dependencies || {};
              const devDependencies = packageJson.devDependencies || {};

              // Add all dependencies to tech stack
              info.techStack = [
                ...Object.keys(dependencies),
                ...Object.keys(devDependencies),
              ];
            }
          } catch (error) {
            console.error("Failed to parse package.json:", error);
          }
        }
      } catch (error) {
        console.error("Failed to extract package.json:", error);
      }
    }

    // Extract project structure
    if (chunk.files.some((f) => f.endsWith("README.md"))) {
      try {
        const readmeMatch = chunk.content.match(
          /=== README\.md ===\n([\s\S]*?)\n=== end README\.md ===/
        );
        if (readmeMatch) {
          const readmeContent = readmeMatch[1];
          const structureMatch = readmeContent.match(
            /## Project Structure\n\n```\n([\s\S]*?)```/
          );
          if (structureMatch) {
            info.projectStructure = structureMatch[1].trim();
          }
        }
      } catch (error) {
        console.error("Failed to extract project structure:", error);
      }
    }

    // Extract patterns from TypeScript/JavaScript files
    const tsFiles = chunk.files.filter(
      (f) => f.endsWith(".ts") || f.endsWith(".js")
    );
    if (tsFiles.length > 0) {
      try {
        const patterns = new Set<string>();

        // Look for patterns in each TypeScript/JavaScript file
        for (const file of tsFiles) {
          const fileMatch = chunk.content.match(
            new RegExp(
              `=== ${file.replace(
                /[.*+?^${}()|[\]\\]/g,
                "\\$&"
              )} ===\n([\\s\\S]*?)\n=== end ${file.replace(
                /[.*+?^${}()|[\]\\]/g,
                "\\$&"
              )} ===`
            )
          );
          if (fileMatch) {
            const fileContent = fileMatch[1];
            if (fileContent.includes("class ")) patterns.add("Object-Oriented");
            if (fileContent.includes("interface "))
              patterns.add("Interface-based");
            if (fileContent.includes("async ")) patterns.add("Async/Await");
            if (fileContent.includes("Promise")) patterns.add("Promise-based");
            if (fileContent.includes("function*"))
              patterns.add("Generator-based");
            if (fileContent.includes("Observable")) patterns.add("Reactive");
            if (fileContent.includes("private ")) patterns.add("Encapsulation");
            if (fileContent.includes("extends ")) patterns.add("Inheritance");
            if (fileContent.includes("implements "))
              patterns.add("Implementation");
          }
        }

        info.patterns = Array.from(patterns);
      } catch (error) {
        console.error("Failed to extract patterns:", error);
      }
    }

    return info;
  }

  /**
   * Extracts specification-related information from a chunk
   */
  private async extractSpecificationInfo(
    chunk: AnalysisChunk
  ): Promise<AnalysisProjectAnalysis["specification"]> {
    const info: AnalysisProjectAnalysis["specification"] = {
      goals: [],
      components: [],
      requirements: [],
    };

    // Extract information from README.md
    if (chunk.files.some((f) => f.endsWith("README.md"))) {
      try {
        const readmeMatch = chunk.content.match(
          /=== README\.md ===\n([\s\S]*?)\n=== end README\.md ===/
        );
        if (readmeMatch) {
          const readmeContent = readmeMatch[1];

          // Extract goals
          const goalsMatch = readmeContent.match(
            /## Goals\n\n([\s\S]*?)(?=\n##|$)/
          );
          if (goalsMatch) {
            info.goals = goalsMatch[1]
              .split("\n")
              .map((line) => line.trim())
              .filter((line) => line.startsWith("-"))
              .map((line) => line.substring(1).trim())
              .filter(Boolean); // Remove empty lines
          }

          // Extract requirements
          const requirementsMatch = readmeContent.match(
            /## Requirements\n\n([\s\S]*?)(?=\n##|$)/
          );
          if (requirementsMatch) {
            info.requirements = requirementsMatch[1]
              .split("\n")
              .map((line) => line.trim())
              .filter((line) => line.startsWith("-"))
              .map((line) => line.substring(1).trim())
              .filter(Boolean); // Remove empty lines
          }
        }
      } catch (error) {
        console.error("Failed to extract goals and requirements:", error);
      }
    }

    // Extract components from TypeScript/JavaScript files
    const tsFiles = chunk.files.filter(
      (f) => f.endsWith(".ts") || f.endsWith(".js")
    );
    if (tsFiles.length > 0) {
      try {
        const components = new Set<string>();

        // Extract class names
        const classMatches = chunk.content.match(/class\s+(\w+)/g);
        if (classMatches) {
          classMatches.forEach((match) => {
            const className = match.split(/\s+/)[1];
            if (className) {
              components.add(className);
            }
          });
        }

        // Extract interface names
        const interfaceMatches = chunk.content.match(/interface\s+(\w+)/g);
        if (interfaceMatches) {
          interfaceMatches.forEach((match) => {
            const interfaceName = match.split(/\s+/)[1];
            if (interfaceName) {
              components.add(interfaceName);
            }
          });
        }

        // Extract type names
        const typeMatches = chunk.content.match(/type\s+(\w+)\s*=/g);
        if (typeMatches) {
          typeMatches.forEach((match) => {
            const typeName = match.split(/\s+/)[1];
            if (typeName) {
              components.add(typeName);
            }
          });
        }

        info.components = Array.from(components);
      } catch (error) {
        console.error("Failed to extract components:", error);
      }
    }

    return info;
  }

  /**
   * Merges chunk analysis results into the main analysis
   */
  private mergeAnalysis(
    analysis: AnalysisProjectAnalysis,
    chunkAnalysis: ChunkAnalysisResult
  ): void {
    try {
      if (chunkAnalysis.architecture) {
        // Merge tech stack
        analysis.architecture.techStack = [
          ...new Set([
            ...analysis.architecture.techStack,
            ...(chunkAnalysis.architecture.techStack || []),
          ]),
        ];

        // Merge project structure (prefer non-empty structure)
        if (chunkAnalysis.architecture.projectStructure) {
          analysis.architecture.projectStructure =
            chunkAnalysis.architecture.projectStructure;
        }

        // Merge patterns
        analysis.architecture.patterns = [
          ...new Set([
            ...analysis.architecture.patterns,
            ...(chunkAnalysis.architecture.patterns || []),
          ]),
        ];
      }

      if (chunkAnalysis.specification) {
        // Merge goals
        analysis.specification.goals = [
          ...new Set([
            ...analysis.specification.goals,
            ...(chunkAnalysis.specification.goals || []),
          ]),
        ];

        // Merge components
        analysis.specification.components = [
          ...new Set([
            ...analysis.specification.components,
            ...(chunkAnalysis.specification.components || []),
          ]),
        ];

        // Merge requirements
        analysis.specification.requirements = [
          ...new Set([
            ...analysis.specification.requirements,
            ...(chunkAnalysis.specification.requirements || []),
          ]),
        ];
      }
    } catch (error) {
      throw new AnalysisSystemError(
        AnalysisError.MERGE_ERROR,
        "Failed to merge chunk analysis results",
        error
      );
    }
  }
}
