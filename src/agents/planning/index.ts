import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { getChatHistory, updateChatHistory } from "../../services/filesystem";
import { readContextFile } from "../../services/filesystem";

/**
 * Builds the system prompt with project context and current session history
 * @returns Complete system prompt with rules, project memory, and chat history
 */
const buildSystemPrompt = (): string => {
  const buildforceRules = readContextFile("buildforce/rules.md");
  const architecture = readContextFile("buildforce/memory/architecture.md");
  const specification = readContextFile("buildforce/memory/specification.md");
  const chatHistory = getChatHistory();

  return `You are a planning agent that follows the Buildforce workflow rules.

# Buildforce Rules
${buildforceRules}

# Project Architecture
${architecture}

# Project Specification
${specification}

# Current Session History
${chatHistory}

Your goal is to brainstorm with the user about the session they are about to start, and once all the needed information is in place, to construct a detailed plan and create the needed session files as described in the Buildforce rules. Be friendly and engaging, and refer back to previous messages in the conversation to maintain context.

When starting a new conversation, ask the user what they are planning to work on next in a friendly and engaging way.`;
};

/**
 * Starts a new planning conversation
 * @param modelInstance ChatOpenAI instance to use
 * @returns Initial welcome message
 */
export const startPlanningConversation = async (
  modelInstance: ChatOpenAI
): Promise<string> => {
  const prompt = ChatPromptTemplate.fromMessages([
    new SystemMessage(buildSystemPrompt()),
    new HumanMessage("Let's start a new planning session."),
  ]);

  const parser = new StringOutputParser();
  const chain = prompt.pipe(modelInstance).pipe(parser);

  const welcomeMessage = await chain.invoke(
    "Let's start a new planning session."
  );
  await updateChatHistory("Assistant", welcomeMessage);
  return welcomeMessage;
};

/**
 * Asks the model a question and returns the response
 * @param input The input text to send to the model
 * @param modelInstance ChatOpenAI instance to use
 * @returns Promise with the model's response
 */
export const askModel = async (input: string, modelInstance: ChatOpenAI) => {
  // First update chat history with user input
  await updateChatHistory("User", input);

  const prompt = ChatPromptTemplate.fromMessages([
    new SystemMessage(buildSystemPrompt()),
    new HumanMessage(input),
  ]);

  const parser = new StringOutputParser();
  const chain = prompt.pipe(modelInstance).pipe(parser);

  const response = await chain.invoke(input);

  // Then update chat history with assistant's response
  await updateChatHistory("Assistant", response);

  return response;
};
