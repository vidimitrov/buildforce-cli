import { AIMessage, BaseMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";
import { StateGraph } from "@langchain/langgraph";
import {
  MemorySaver,
  Annotation,
  messagesStateReducer,
} from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { readContextFile } from "../../services/filesystem";
import { exampleTool } from "./tools";

/**
 * Builds the system prompt with project context and current session history
 * @returns Complete system prompt with rules, project memory, and chat history
 */
const buildSystemPrompt = (): string => {
  const buildforceRules = readContextFile("buildforce/rules.md");
  const architecture = readContextFile("buildforce/memory/architecture.md");
  const specification = readContextFile("buildforce/memory/specification.md");

  return `You are a planning agent that follows the Buildforce workflow rules.

# Buildforce Rules
${buildforceRules}

# Project Architecture
${architecture}

# Project Specification
${specification}

Your goal is to brainstorm with the user about the session they are about to start, and once all the needed information is in place, to construct a detailed plan and create the needed session files as described in the Buildforce rules. Be friendly and engaging, and refer back to previous messages in the conversation to maintain context.

When starting a new conversation, ask the user what they are planning to work on next in a friendly and engaging way.`;
};

// Define the graph state
const StateAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: messagesStateReducer,
  }),
});

const tools = [exampleTool];
const toolNode = new ToolNode(tools);

// Initialize the LLM
const model = new ChatOpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  model: "anthropic/claude-3.7-sonnet",
  temperature: 0,
  configuration: {
    baseURL: "https://openrouter.ai/api/v1",
  },
}).bindTools(tools);

// Define the function that determines whether to continue or not
function shouldContinue(state: typeof StateAnnotation.State) {
  const messages = state.messages;
  const lastMessage = messages[messages.length - 1] as AIMessage;

  // If the LLM makes a tool call, then we route to the "tools" node
  if (lastMessage.tool_calls?.length) {
    return "tools";
  }
  // Otherwise, we stop (reply to the user)
  return "__end__";
}

// Define the function that calls the model
async function callModel(state: typeof StateAnnotation.State) {
  const messages = [
    { role: "system", content: buildSystemPrompt() },
    ...state.messages,
  ];
  const response = await model.invoke(messages);

  // We return a list, because this will get added to the existing list
  return { messages: [response] };
}

// Define the graph
const workflow = new StateGraph(StateAnnotation)
  .addNode("agent", callModel)
  .addNode("tools", toolNode)
  .addEdge("__start__", "agent")
  .addConditionalEdges("agent", shouldContinue)
  .addEdge("tools", "agent");

// Initialize memory to persist state between API calls
const checkpointer = new MemorySaver();
const agent = workflow.compile({ checkpointer });

export default agent;
