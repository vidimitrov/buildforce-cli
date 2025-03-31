# buildforce

This directory is specifically designed to be used by Large Language Models (LLMs) to gather project-specific context and maintain awareness of the overall project specification. It serves as a central knowledge base that helps AI agents understand the project's requirements, track progress, and effectively participate in coding sessions.

## Directory Structure

### 📁 memory/

Contains crucial project information that can be automatically generated and maintained by LLMs through codebase analysis, documentation review, and ongoing updates.

- [**specification.md**](./memory/specification.md) - Defines the project's initial requirements, high-level component descriptions, product vision, and future plans. This file serves as the foundational document that answers fundamental questions about the project's purpose and goals.

- [**architecture.md**](./memory/architecture.md) - Details the repository's overall architecture, including:

  - Component/application architecture
  - Tech stack specifications
  - System patterns and best practices
  - Guidelines for future development

This file enables LLMs to make informed decisions about prioritization and suggest improvements based on upcoming changes.

### 📁 sessions/

Maintains detailed records of development sessions and planning:

- 📁 **completed/** - Contains comprehensive documentation of completed sessions, including:

  - Detailed task descriptions
  - Implementation approaches
  - Challenges encountered and solutions
  - Code changes and their rationale

- 📁 **planned/** - Houses upcoming session plans and tasks:

  - Pre-defined task specifications
  - Implementation guidelines
  - Context required for AI agents to begin work
  - Dependencies and prerequisites

- [**active-session**](./sessions/.active-session) - Points to the currently active development session in the planned directory. This file helps maintain context about which session is currently being worked on.

Each session/task is structured to provide sufficient context for AI agents to immediately begin development work.

### 📁 templates/

Contains standardized templates for creating consistent documentation:

- [**task-template.md**](./templates/task-template.md) - Template for creating new tasks
- [**session-template.md**](./templates/session-template.md) - Template for documenting coding sessions
- [**architecture-template.md**](./templates/architecture-template.md) - Template for documenting project architecture
- [**specification-template.md**](./templates/specification-template.md) - Template for project specification

## Purpose

The `buildforce` directory serves as a living documentation system that:

1. Provides AI agents with comprehensive project context
2. Maintains historical knowledge of development decisions
3. Facilitates automated task planning and execution
4. Ensures consistency in documentation and development approaches
5. Enables seamless collaboration between human developers and AI agents

## Onboarding

The `buildforce` directory is designed to be easily set up for new projects. Follow these steps to initialize the directory structure for your project:

1. **Create the basic directory structure**:

   - Create a `buildforce` folder in your project root
   - Within `buildforce`, create `memory/`, `sessions/completed/`, `sessions/planned/`, and `templates/` folders
   - Create an empty `.active-session` file in the `sessions/` directory

2. **Copy the template files**:

   - Copy all template files from a reference project or the buildforce repository
   - Place them in the `buildforce/templates/` directory

3. **Generate initial documentation**:

   - Use AI assistance to analyze your codebase
   - Populate `memory/architecture.md`, and `memory/specification.md` files using the corresponding templates
   - The AI will scan your project for README files, documentation, comments, and code structure

4. **Review and refine**:

   - Review the auto-generated documentation for accuracy
   - Refine as needed to ensure it correctly represents your project
   - Commit the `buildforce` directory to your repository

5. **Begin new session**:
   - Create initial session folder (with a descriptive short name and the next iterative number - ex. "session-2-task-management") in `sessions/planned/` and a new `session.md` file in it using the session template
   - Create a `.chat-history.md` and keep it updated as the conversation progresses
   - Once the user confirms on a plan create the needed tasks using the task template
   - Update the `.active-session` file to point to the current session directory

For detailed onboarding instructions, see the [**RULES.md**](./RULES.md) file.

## Maintenance

The contents of this directory are meant to evolve alongside the project. LLMs are responsible for keeping these files up to date as the project progresses, following specific instructions defined in [**RULES.md**](./RULES.md).

For new projects, the initial structure can be automatically populated by AI agents during the onboarding process using the provided templates.
