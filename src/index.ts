#!/usr/bin/env node
import "dotenv/config";
import { Command } from "commander";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import * as fs from "fs";
import * as path from "path";

const model = new ChatOpenAI();

const askModel = async (input: string) => {
  const prompt = ChatPromptTemplate.fromMessages([
    new SystemMessage("You're a helpful assistant"),
    new HumanMessage(input),
  ]);

  const parser = new StringOutputParser();
  const chain = prompt.pipe(model).pipe(parser);

  return await chain.invoke(input);
};

const getTemplateDir = () => {
  // In development, use the src directory
  const devPath = path.join(__dirname, "..", "src", "templates", ".buildforce");
  if (fs.existsSync(devPath)) {
    return devPath;
  }

  // In production, use the dist directory
  const prodPath = path.join(__dirname, "templates", ".buildforce");
  if (fs.existsSync(prodPath)) {
    return prodPath;
  }

  throw new Error(
    "Template directory not found. Please ensure the templates are properly copied during build."
  );
};

const copyBuildforceTemplate = async (targetDir: string) => {
  const templateDir = getTemplateDir();
  const targetBuildforceDir = path.join(targetDir, ".buildforce");

  // Create the target directory if it doesn't exist
  if (!fs.existsSync(targetBuildforceDir)) {
    fs.mkdirSync(targetBuildforceDir, { recursive: true });
  }

  // Copy all files and directories from the template
  const copyDir = (src: string, dest: string) => {
    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      if (entry.isDirectory()) {
        fs.mkdirSync(destPath, { recursive: true });
        copyDir(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  };

  copyDir(templateDir, targetBuildforceDir);
  console.log("Successfully initialized project");
};

const program = new Command();

program
  .name("buildforce")
  .description("CLI tool for using the Buildforce planning capabilities")
  .version("0.0.0");

program
  .command("init")
  .description("Initialize a new project")
  .argument("<projectName>", "The project to initialize")
  .action(async (projectName) => {
    console.log("Initializing project...");
    console.log(`Project name: ${projectName}`);

    try {
      await copyBuildforceTemplate(process.cwd());
    } catch (error) {
      console.error("Error initializing project:", error);
      process.exit(1);
    }
  });

program
  .command("plan")
  .description("Start planning a new coding session")
  .action(async () => {
    let conversationActive = true;
    let question = "What would you like to work on?";

    while (conversationActive) {
      const answer = await askModel(question);
      console.log(`\nBuildforce: ${answer}\n`);

      const readline = require("readline").createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      const userInput = await new Promise<string>((resolve) => {
        readline.question(
          "Your response (type EXIT or STOP to end): ",
          resolve
        );
      });

      readline.close();

      if (
        userInput.toUpperCase() === "EXIT" ||
        userInput.toUpperCase() === "STOP"
      ) {
        conversationActive = false;
        console.log("\nEnding conversation...\n");
      } else {
        question = userInput;
      }
    }
  });

program.parse();
