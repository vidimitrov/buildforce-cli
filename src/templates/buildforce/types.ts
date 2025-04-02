export interface ArchitectureTemplateData {
  description?: string;
  frameworks: string[];
  runtime?: string;
  language?: string;
  testFrameworks: string[];
  dependencies: string[];
  buildTools: string[];
  structure: {
    directories: string[];
  };
}

export interface Component {
  name: string;
  technologies: string[];
  architecture: string;
  responsibilities: string;
  implementation: string;
  features: string[];
  integrationPoints: string[];
  considerations: string[];
}

export interface SpecificationTemplateData {
  name: string;
  description?: string;
  components: Component[];
  type: string;
  buildTools: string[];
  testFrameworks: string[];
  futureExpansions: string[];
  integrationCapabilities: string[];
}

export interface Task {
  name: string;
  description?: string;
}

export interface VerificationStep {
  name: string;
  details: string[];
}

export interface SessionTemplateData {
  number: number;
  name: string;
  objective: string;
  decisions: {
    summary: string;
    items: string[];
  };
  tasks: Task[];
  expectedOutcomes: string[];
  verificationSteps: VerificationStep[];
}

export interface BackendImplementation {
  schema: string;
  graphqlSchema: string;
  resolvers: string[];
  services: string[];
  migrations: string[];
}

export interface FrontendImplementation {
  graphql: string[];
  components: string;
  state: string[];
  features: string[];
  uiComponents: string[];
}

export interface Testing {
  backend: string[];
  frontend: string[];
}

export interface TaskTemplateData {
  number: number;
  name: string;
  architectureContext: string;
  specificationContext: string;
  rules: string;
  subTasks: Task[];
  overview: string;
  backendImplementation?: BackendImplementation;
  frontendImplementation?: FrontendImplementation;
  dataModels: string;
  ui: string[];
  ux: string[];
  accessibility: string[];
  testing: Testing;
}
